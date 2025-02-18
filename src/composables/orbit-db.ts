/* eslint-disable @typescript-eslint/no-explicit-any */
import { RELAY_ADDRESS } from "@/constants";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { createOrbitDB, type OrbitDB } from '@orbitdb/core'

import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { all } from "@libp2p/websockets/filters";
import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";
import { createHelia, type HeliaLibp2p } from "helia";
import { createLibp2p, type Libp2p, type Libp2pOptions } from "libp2p";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";

export const libp2pOptions: Libp2pOptions = {
  addresses: {
    listen: ['/webrtc', '/p2p-circuit']
  },
  transports: [
    webSockets({
      filter: all
    }),
    webRTC(),
    circuitRelayTransport()
  ],
  peerDiscovery: [
      bootstrap({
        list: [RELAY_ADDRESS],
        timeout: 0,
      }),
      pubsubPeerDiscovery({
        interval: 10000,
        topics: ["constellation._peer-discovery._p2p._pubsub"], // par défaut : ['_peer-discovery._p2p._pubsub']
        listenOnly: false,
      }),
    ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  connectionGater: {
    denyDialMultiaddr: () => false
  },
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true })
  }
}
export const initOrbiter: () => Promise<{
  orbitDB: OrbitDB<Libp2p<any>>;
  ipfs: HeliaLibp2p<Libp2p<any>>;
}> = async () => {
  const libp2p = await createLibp2p(libp2pOptions)
  const blockstore = new IDBBlockstore('./ipfs/blocks')
  const datastore = new IDBDatastore('./ipfs/data')
  await blockstore.open()
  await datastore.open()
  const ipfs = await createHelia({ libp2p, blockstore, datastore })
  const orbitDB = await createOrbitDB({ ipfs })
  libp2p.addEventListener("peer:discovery", async (e) => {
    try {
      console.log("dialing peer", e.detail.id.toString());
      await libp2p.dial(e.detail.id)
    } catch (error) {
      console.log('error dialing new peer', error);
    }
  })

  libp2p.addEventListener("peer:connect", (e) => {
    console.log("new peer has connected", e.detail.toString());
  })
  return { orbitDB, ipfs }

}

