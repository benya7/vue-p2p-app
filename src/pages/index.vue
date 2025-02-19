<template>
  <v-container>
    <h1>P2P APP</h1>
    <p v-if="peerId">
      Peer ID: {{ peerId }}
    </p>
    <p v-if="peerId">
      Account ID: {{ accountId }}
    </p>
    <p v-if="peerId">
      Device ID: {{ deviceId }}
    </p>
    <p v-if="localDBAddress">
      Local DB Address: {{ localDBAddress }}
    </p>

    <v-divider class="my-2" />
    <div class="ga-2 d-flex flex-column md-flex-row">
      <v-btn @click="logPeers">
        peers
      </v-btn>
      <v-btn @click="createLocalDB">
        create local db
      </v-btn>
      <v-btn @click="logLocalEntries">
        local entries
      </v-btn>
      <v-btn @click="logRemoteEntries">
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
import { useConstellation } from '@/composables/use-constellation';
import { obt } from '@constl/vue';
import type { KeyValueDatabase } from '@orbitdb/core';
import { types as constellationTypes } from '@constl/ipa'

const constellation = useConstellation();
const peerId = obt(constellation.obtIdSFIP)
const accountId = obt(constellation.obtIdCompte)
const deviceId = obt(constellation.obtIdDispositif)

const localDBAddress: Ref<string | undefined> = ref()
const localDB: Ref<KeyValueDatabase | undefined> = ref()
const remoteDB: Ref<KeyValueDatabase | undefined> = ref()

const forgetLocalDB: Ref<constellationTypes.schémaFonctionOublier | undefined> = ref()
const forgetRemoteDB: Ref<constellationTypes.schémaFonctionOublier | undefined> = ref()

const newDBKey: Ref<string | undefined> = ref()
const newDBValue: Ref<string | undefined> = ref()

const remoteDBAddress: Ref<string | undefined> = ref()

const logPeers = async () => {
  const { sfip } = await constellation.attendreSfipEtOrbite()
  console.log(sfip.libp2p.getPeers().map(p => p.toString()));
}
const createLocalDB = async () => {
  localDBAddress.value = await constellation.créerBdIndépendante({
    type: "keyvalue"
  })
  const { bd, fOublier} = await constellation.ouvrirBd({
    id: localDBAddress.value,
    type: 'keyvalue'
  })
  localDB.value = bd;
  forgetLocalDB.value = fOublier
}
const openRemoteDB = async () => {
  if (!remoteDBAddress.value) return;
  const { bd, fOublier} = await constellation.ouvrirBd({
    id: remoteDBAddress.value,
    type: 'keyvalue'
  })
  remoteDB.value = bd;
  forgetRemoteDB.value = fOublier
}
const logLocalEntries = async () => {
  console.log(await localDB.value?.all());
}
const logRemoteEntries = async () => {
  console.log(await remoteDB.value?.all());
}
const handlePutValue = async () => {
  if (!newDBKey.value || !newDBValue.value) return;
  await localDB.value?.set(newDBKey.value, newDBValue.value)
}

onBeforeUnmount(async () => {
  await forgetLocalDB.value?.()
  await forgetRemoteDB.value?.()
  await constellation.fermer()
})
</script>
