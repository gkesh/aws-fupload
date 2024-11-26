<template>
  <header class="header">
    <h4>FUpload</h4>
    <div class="dropdown">
      <button @click="reload" class="profile">↺</button>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AppHeader",
  emits: ["on-reload"],
  props: {},
  setup(_, { emit }) {
    const reload = () => {
      emit("on-reload");
    };

    return {
      reload,
    };
  },
});
</script>

<style lang="scss" scoped>
h4 {
  padding: 0;
  margin: 0;
}

.header {
  padding: 1rem;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.15);
  border-radius: 0 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 50%;
  margin: 0 auto;
  max-width: 100%;
}

.header .profile {
  height: 32px;
  width: 32px;
  font-size: 1.5em;
  padding-bottom: 5px;
  border-radius: 50px;
  background: peachpuff;
  border: none;
  cursor: pointer;
}

.dropdown {
  position: relative;
  display: inline-block;
}

@media only screen and (max-width: 640px) {
  .header {
    width: auto;
  }
}
</style>
