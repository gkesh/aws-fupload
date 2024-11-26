<template>
  <main>
    <section class="upload">
      <form id="files">
        <div class="nothing" v-if="fileCount === 0">
          No files selected. Please click the "More" button to get started.
        </div>
        <UploadBox
          v-else
          v-for="serialNo in files"
          :index="serialNo"
          :key="'upload' + serialNo"
          @on-remove="deleteFile"
          @on-error="setError"
        />
      </form>
    </section>
    <section class="actions">
      <button type="submit" class="success" @click="uploadFiles($event)">
        Upload
      </button>
      <button type="button" class="more" @click="incrementFileCount">
        More
      </button>
      <button
        v-if="fileCount > 0"
        type="button"
        class="error"
        @click="clearFiles"
      >
        Clear
      </button>
    </section>
    <section class="history">
      <div v-if="historyStatus === 0">Loading...</div>
      <div v-else-if="historyStatus < 0">Failed to load history!</div>
      <div v-else>
        <div v-if="history.length > 0">
          <HistoryBox
            v-for="(media, i) in history"
            :title="media.title"
            :extension="media.extension"
            :date-uploaded="new Date(media.dateUploaded).toLocaleString()"
            :url="server + '/uploads/' + media.filename"
            :key="'media' + i"
            @on-error="setError"
          />
        </div>
        <div v-else>No files uploaded yet!</div>
      </div>
    </section>
    <div class="errors">
      <div v-for="(error, i) in errors" :key="'error' + i">{{ error }}</div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from "vue";
import UploadBox from "@/components/UploadBox.vue";
import HistoryBox from "@/components/HistoryBox.vue";
import { Media, Extension } from "@/models/file";

export default defineComponent({
  name: "App",
  components: {
    UploadBox,
    HistoryBox,
  },
  setup() {
    const server = "http://localhost:8081";
    const fileCount: Ref<number> = ref(0);
    const files: Ref<number[]> = ref([]);

    /**
     * 0 - Loading
     * -1 - Error
     * 1 - Loaded
     */
    const historyStatus: Ref<number> = ref(0);
    const history: Ref<Media[]> = ref([]);

    const errors: Ref<string[]> = ref([]);

    const incrementFileCount = (): void => {
      fileCount.value = fileCount.value + 1;
      files.value[files.value.length] = fileCount.value;
    };

    const deleteFile = (id: number): void => {
      files.value = files.value.filter((item) => item !== id);
    };

    const clearFiles = (): void => {
      fileCount.value = 0;
      files.value = [];
    };

    const setError = (error: string) => {
      errors.value[errors.value.length] = error;

      // Error disappears in 3 seconds
      setTimeout(() => {
        errors.value = errors.value.slice(1);
      }, 3000);
    };

    const uploadFiles = async (event: Event) => {
      event.preventDefault();

      const formData = new FormData(
        document.getElementById("files") as HTMLFormElement
      );

      if (formData.entries().next().done) {
        setError("No files selected");
        return;
      }

      // Testing empty form fields
      let isFormDataValid = true;
      formData.forEach((file, key) => {
        if ((file as File).size === 0) {
          setError(`${key} file field is empty!`);
          isFormDataValid = false;
          return;
        }
      });

      if (!isFormDataValid) {
        return;
      }

      interface UploadResponse {
        errors?: string[];
        rejected?: { [fileId: string]: string };
        uploaded?: { [fileId: string]: string };
      }

      const data: UploadResponse = await fetch(`${server}/upload`, {
        method: "POST",
        mode: "cors",
        body: formData,
      }).then((res) => res.json());

      if (data) {
        if (data.rejected && Object.keys(data.rejected).length > 0) {
          Object.entries(data.rejected).forEach(
            ([file, message]: [string, string]) => {
              setError(`File ${file} rejected: ${message}`);
            }
          );
        }

        if (data.uploaded && Object.keys(data.uploaded).length > 0) {
          Object.entries(data.uploaded).forEach(
            ([, filename]: [string, string]) => {
              const [timestamp, ...uploadName] = filename.split("_");
              const extension = filename.split(".").splice(-1)[0] as Extension;

              // Skips invalid extensions and files that dont match naming schemes
              const uploadedFile: Media = {
                title: uploadName.join("_"),
                filename,
                extension,
                dateUploaded: new Date(parseInt(timestamp, 10)),
                s3Key: "",
              };

              // Pushing to history
              history.value.push(uploadedFile);
            }
          );
        }
      }

      clearFiles();
    };

    // Loading history data once mounted
    onMounted(async () => {
      const data = await fetch(`${server}/all`, {
        method: "GET",
        mode: "cors",
      })
        .then((res) => res.json())
        .catch((error) => {
          alert(error);
          historyStatus.value = -1;
        });

      if (historyStatus.value >= 0) {
        history.value = data as Media[];
        historyStatus.value = 1;
      }
    });

    return {
      errors,
      files,
      server,
      fileCount,
      clearFiles,
      deleteFile,
      uploadFiles,
      setError,
      incrementFileCount,
      history,
      historyStatus,
    };
  },
});
</script>

<style lang="scss">
:root {
  --primary: #6d5e79;
  --success: #436f49;
  --error: #5f2828;
  --backgroundPrimary: #dbc3ed;
  --backgroundSuccess: #9befbc;
  --backgroundError: #fac0af;
  --backgroundLight: #f2f2f2;
  --backgroundMuted: #ebe5ff;

  --border: #e2e2e2;
  --text: #2c3e50;
}

* {
  font-family: Ubuntu, Avenir, Helvetica, Arial, sans-serif;
  font-weight: 500;
  box-sizing: border-box;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--text);
}

main {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;

  section {
    width: 960px;
    max-width: 100%;
    margin-bottom: 2rem;
    border-radius: 24px;

    .nothing {
      margin: 24px 0;
      font-style: italic;
    }

    &.upload {
      background: var(--backgroundLight);
    }

    &.history {
      background: var(--backgroundMuted);
      padding: 20px;
    }

    &.actions {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 20px;
    }
  }

  .errors {
    position: fixed;
    bottom: 1rem;
    left: 1rem;

    div {
      background: var(--backgroundError);
      color: var(--error);
      font-size: 0.9em;
      font-weight: 400;
      font-style: italic;
      border-radius: 8px;
      pointer-events: none;
      padding: 10px 20px;
      margin-top: 10px;
    }
  }

  input,
  button {
    padding: 12px 24px;
    border-radius: 12px;
    border: none;
    cursor: pointer;

    &.primary {
      background: var(--backgroundPrimary);
      color: var(--primary);
    }

    &.primary-dark {
      background: var(--primary);
      color: white;
    }

    &.error {
      background: var(--backgroundError);
      color: var(--error);
    }

    &.success {
      background: var(--backgroundSuccess);
      color: var(--success);
    }
  }
}
</style>
