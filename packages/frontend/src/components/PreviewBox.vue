<template>
  <div class="preview-content">
    <div v-if="['jpg', 'jpeg', 'png'].includes(extension)" class="image">
      <img :src="url" alt="Image File" />
    </div>
    <div v-else-if="extension === 'mp3'" class="audio">
      <audio controls autoplay>
        <source :src="url" type="audio/mpeg" />
      </audio>
    </div>
    <div v-else-if="extension === 'mp4'" class="video">
      <video controls>
        <source :src="url" type="video/mp4" />
      </video>
    </div>
    <div v-else class="invalid">Invalid file, please check the server.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "PreviewBox",
  props: {
    url: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.preview-content {
  margin-top: 24px;

  img,
  video {
    width: 100%;
  }
}
</style>
