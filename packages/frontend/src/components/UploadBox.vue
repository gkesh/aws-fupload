<template>
  <div class="upload-box">
    <span class="serial">{{ index }}</span>
    <input
      type="file"
      :name="'file-' + index"
      accept="image/jpeg, image/png, audio/mpeg, video/mp4"
      @change="validate($event)"
    />
    <button type="button" class="error" @click="emitRemove(index)">
      Remove
    </button>
  </div>
  <span></span>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Extension } from "@/models/file";

export default defineComponent({
  name: "UploadBox",
  props: {
    index: {
      type: Number,
      default: 0,
    },
  },
  emits: ["on-remove", "on-error"],
  setup(_, { emit }) {
    const emitRemove = (index: number): void => {
      emit("on-remove", index);
    };

    const emitError = (element: HTMLInputElement, message: string): void => {
      emit("on-error", message);
      element.type = "text";
      element.value = "";
      element.type = "file";
    };

    const validate = (event: Event) => {
      const inputElement: HTMLInputElement = event.target as HTMLInputElement;
      const file = inputElement?.files?.length && inputElement.files[0];

      if (!file) {
        return;
      }

      try {
        const fr = new FileReader();
        const fileType: Extension = file.name
          .split(".")
          .slice(-1)[0] as Extension;

        if (["jpg", "jpeg", "png"].includes(fileType)) {
          // Validating Image
          if (file.size / (1024 * 1024) > 3) {
            emitError(inputElement, `Image ${file.name} size exceeded 3MB`);
            return;
          }

          fr.onload = () => {
            const img: HTMLImageElement = document.createElement("img");
            img.src = fr.result as string;

            const timeout = img.height === 0 ? 1000 : 0;

            setTimeout(() => {
              const height = img.height;

              // Assuming resolution by vertical pixel count
              if (height < 1080) {
                emitError(
                  inputElement,
                  `Image ${file.name} size less than 1080px`
                );
                return;
              }
            }, timeout);
          };
        } else if (fileType === "mp3") {
          // Validating audio
          fr.onload = () => {
            const audio = new Audio();
            audio.addEventListener("loadedmetadata", () => {
              // Introducing delay in load if processing is slow
              const timeout = audio.duration === Infinity ? 1000 : 0;
              setTimeout(() => {
                if (audio.duration / 60 > 1) {
                  emitError(
                    inputElement,
                    `Audio ${file.name} duration is greater than 1 minutes.`
                  );
                  return;
                }
              }, timeout);
            });

            audio.src = fr.result as string;
          };
        } else if (fileType === "mp4") {
          // Validating video
          fr.onload = () => {
            const video = document.createElement("video");
            video.preload = "metadata";

            video.addEventListener("loadedmetadata", () => {
              const timeout = video.duration === Infinity ? 1000 : 0;
              setTimeout(() => {
                // Assuming resolution by vertical pixel count
                if (video.videoHeight < 720) {
                  emitError(
                    inputElement,
                    `Video ${file.name} is not 720p or higher.`
                  );
                  return;
                }

                if (video.duration / 60 > 1) {
                  emitError(
                    inputElement,
                    `Video ${file.name} duration is more than 1 minute.`
                  );
                  return;
                }
              }, timeout);
            });

            video.src = fr.result as string;
          };
        } else {
          throw Error();
        }

        fr.readAsDataURL(file);
      } catch (error) {
        emitError(inputElement, `Invalid file ${file.name}`);
        return;
      }
    };

    return {
      emitRemove,
      validate,
    };
  },
});
</script>

<style lang="scss" scoped>
.upload-box {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;

  &:not(:first-of-type) {
    border-top: 1px solid var(--border);
  }

  .serial {
    width: 50px;
    padding: 12px;
    border-radius: 12px;
    font-weight: 900;
    background: var(--backgroundPrimary);
    color: var(--primary);
    flex: 1;
  }

  input {
    flex: 6;
  }

  button {
    flex: 1;
  }
}
</style>
