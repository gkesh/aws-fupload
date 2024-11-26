<template>
  <AppHeader @on-reload="loadHistory" />
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
      <button type="submit" class="success" @click.prevent="uploadFiles">
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
            :id="media.fileId!"
            :title="media.title"
            :extension="media.extension"
            :date-uploaded="new Date(media.dateUploaded).toLocaleString()"
            :url="media.url!"
            :key="'media' + i"
            @on-delete="removeUpload"
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
import AppHeader from "./layout/AppHeader.vue";
import { Media, Extension } from "@/models/file";
import { GATEWAY_URL } from "./config";
import { Failure } from "./models/failure";
import { putObject, getObjectUrl, deleteObject } from "./libs";

export default defineComponent({
  name: "App",
  components: {
    UploadBox,
    HistoryBox,
    AppHeader,
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

    const parseFileName = (str: string, substring: string) => {
      const lastIndex = str.lastIndexOf(substring);
      const before = str.slice(0, lastIndex);
      const after = str.slice(lastIndex + 1);
      return [before, after];
    };

    const processFile = async (f: File, key: string): Promise<Media | null> => {
      try {
        // Uploading files to S3
        const s3Key = await putObject(f);

        const [title, extension] = parseFileName(f.name, ".");
        return {
          title,
          filename: f.name,
          extension: extension as Extension,
          dateUploaded: new Date().toLocaleString(),
          mimetype: f.type,
          size: f.size,
          s3Key,
        };
      } catch (e) {
        setError(`File ${key} failed to upload: ${(e as Error).message}`);
        return null;
      }
    };

    // Generate S3 Link from Key
    const generateS3Url = async (key: string) => {
      return await getObjectUrl(key);
    };

    const processResponse = async (response: Response): Promise<Media[]> => {
      return await Promise.all(
        (
          await response.json()
        ).map(async (item: Media) => {
          const url = await generateS3Url(item.s3Key || "");
          return {
            ...item,
            url,
          };
        })
      );
    };

    const uploadFiles = async () => {
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

      const uploads = (
        await Promise.all(
          Array.from(formData).map(([key, file]) =>
            processFile(file as File, key)
          )
        )
      ).filter((item) => item !== null);

      // Saving Upload to Database
      const response = await fetch(`${GATEWAY_URL}uploads`, {
        method: "POST",
        body: JSON.stringify(uploads),
      });

      if (response.status !== 200) {
        const failure: Failure = (await response.json()) as Failure;
        setError(`[${failure.level}] ${failure.message}`);
        clearFiles();
        return;
      }

      const succesfulUploads = await processResponse(response);
      history.value.push(...succesfulUploads);

      clearFiles();
    };

    const loadHistory = async () => {
      history.value = [];
      historyStatus.value = 0;

      const response = await fetch(`${GATEWAY_URL}uploads`);

      if (response.status !== 200) {
        const failure: Failure = (await response.json()) as Failure;
        alert(`[${failure.level}] ${failure.message}`);
        historyStatus.value = -1;
      }

      const uplaods = await processResponse(response);

      history.value = uplaods as Media[];
      historyStatus.value = 1;
    };

    const removeUpload = async (id: string) => {
      // Find item
      const item = history.value.filter((item) => item.fileId === id)[0];

      if (item && item.s3Key && item.fileId) {
        const response = await fetch(`${GATEWAY_URL}uploads/${item.fileId}`);

        if (response.status !== 200) {
          const failure: Failure = (await response.json()) as Failure;
          setError(`[${failure.level}] ${failure.message}`);
          return;
        }

        const upload = (await processResponse(response))[0];

        // Remove item from S3
        await deleteObject(item.s3Key);

        // Delete item from dynamodb
        await fetch(`${GATEWAY_URL}uploads/${item.fileId}`, {
          method: "DELETE",
        });

        history.value = history.value.filter(
          (hitem) => hitem.fileId !== upload.fileId
        );
        setError(`File deleted: ${upload.fileId}`);
      }
    };

    // Loading history data once mounted
    onMounted(async () => {
      await loadHistory();
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
      loadHistory,
      removeUpload,
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

body {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
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
