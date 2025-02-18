<template>
  <v-container>
    <h1>P2P APP</h1>
    <p>Peer ID: {{ peerId }}</p>
    <p v-if="localDB">
      LocalDB Address {{ localDB.address }}
    </p>
    <v-divider class="my-2" />
    <div class="ga-2 d-flex flex-column md-flex-row">
      <v-btn @click="createLocalDB">
        create local DB
      </v-btn>
      <v-btn @click="logPeers">
        peers
      </v-btn>
      <v-btn @click="logLocalDBEntries">
        local entries
      </v-btn>
      <v-btn @click="logRemoteDBEntries">
        remote entries
      </v-btn>
    </div>
    <v-sheet
      color="purple"
      class="mt-4 pa-4"
    >
      <p>
        Open Remote DB
      </p>
      <v-text-field
        v-model="remoteDBAddress"
        label="Remote DB ADdress"
      />
      <v-btn @click="openRemoteDB">
        Submit
      </v-btn>
    </v-sheet>
    <v-sheet
      color="blue"
      class="mt-4 pa-4"
    >
      <p>
        Add new value
      </p>
      <v-text-field
        v-model="newDBKey"
        label="DB Key"
      />
      <v-text-field
        v-model="newDBValue"
        label="DB Value"
      />
      <v-btn @click="handlePutValue">
        Submit
      </v-btn>
    </v-sheet>
  </v-container>
</template>

<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { initOrbiter } from '@/composables/orbit-db';
import type { OrbitDB } from '@orbitdb/core';
import type { HeliaLibp2p } from 'helia';
import type { Libp2p } from 'libp2p';
import { v4 as uuid4 } from 'uuid';
  //
const peerId = computed(() => ipfs.value?.libp2p.peerId)
const localDB = ref()
const remoteDB = ref()
const remoteDBAddress = ref()
const orbitdb: Ref<OrbitDB<Libp2p<any>> | undefined> = ref()
const ipfs: Ref<HeliaLibp2p<Libp2p<any>> | undefined> = ref()

const newDBKey = ref()
const newDBValue = ref()

const createLocalDB = async () => {
  localDB.value = await orbitdb.value?.open(uuid4(), { type: 'keyvalue'})
  console.log(localDB.value.address);
}
const openRemoteDB = async () => {
  if (!remoteDBAddress.value) return;
  try {
    remoteDB.value = await orbitdb.value?.open(remoteDBAddress.value)
  } catch (error) {
    console.log('error opening remote Db', error);
  }
}

const handlePutValue = async () => {
  await localDB.value?.put(newDBKey.value, newDBValue.value)
}

const logPeers = () => {
  console.log(ipfs.value?.libp2p.getPeers().map(p => p.toString()))
}
const logLocalDBEntries = async () => {
  if (!localDB.value) return;
  for await (const record of localDB.value.iterator()) {
    console.log(record)
  }
}
const logRemoteDBEntries = async () => {
  if (!remoteDB.value) return;
  for await (const record of remoteDB.value.iterator()) {
    console.log(record)
  }
}
onBeforeMount(async () => {
  const { orbitDB, ipfs: ipfsController } = await initOrbiter()
  orbitdb.value = orbitDB
  ipfs.value = ipfsController
})
onBeforeUnmount(async () => {
  await orbitdb.value?.stop()
  await ipfs.value?.stop()
  await localDB.value?.close()
  await remoteDB.value?.close()
})
</script>
