<template>
  <div class="history-box">
    <div class="history-blade">
      <div class="history-preview">
        <button class="primary" @click="togglePreview">👀</button>
      </div>
      <div class="history-title">
        {{ title }}
        <span>{{ extension }}</span>
      </div>
      <div class="history-date">
        {{ dateUploaded }}
      </div>
      <div class="history-download">
        <button class="primary-dark" @click="download(url, title)">💾</button>
      </div>
    </div>
    <div v-if="preview" class="preview">
      <PreviewBox :extension="extension" :url="url" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from "vue";
import PreviewBox from "@/components/PreviewBox.vue";

export default defineComponent({
  name: "HistoryBox",
  components: {
    PreviewBox,
  },
  emits: ["on-error"],
  props: {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      required: true,
    },
    dateUploaded: {
      type: String,
      required: true,
    },
  },
  setup(_, { emit }) {
    const preview: Ref<boolean> = ref(false);
    const togglePreview = () => {
      preview.value = !preview.value;
    };

    const download = (url: string, filename: string) => {
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const resourceElement: HTMLAnchorElement =
            document.createElement("a");
          resourceElement.download = filename;
          resourceElement.href = URL.createObjectURL(blob);
          resourceElement.click();
        })
        .catch((error) => {
          emit("on-error", `Filed to download file: ${error}`);
        });
    };

    return {
      download,
      preview,
      togglePreview,
    };
  },
});
</script>

<style lang="scss" scoped>
.history-box {
  margin: 10px 20px;
  padding: 30px 0;

  &:first-of-type {
    margin-top: 0px;
  }

  &:not(:first-of-type) {
    border-top: 1px solid var(--primary);
  }

  &:last-of-type {
    margin-bottom: 0px;
  }
  .history-blade {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 20px;

    .history-preview {
      flex: 1;
    }

    .history-title {
      color: var(--primary);
      font-size: 1.05em;
      text-align: left;
      flex: 8;

      span {
        margin-left: 12px;
        font-size: 0.8em;
        padding: 4px 8px;
        border-radius: 8px;
        background: var(--primary);
        color: white;
      }
    }

    .history-date {
      flex: 4;
      font-size: 0.9em;
      text-align: right;
    }
  }
}
</style>
