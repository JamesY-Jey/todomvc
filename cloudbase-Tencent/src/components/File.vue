<template>
  <div class="file-view">
    <button @click="uploadClick(`upload${id}`)">{{ type === 0 ? '上传文件' : '修改文件' }}</button>
    <button @click="preview">查看</button>
    <input class="file-input" type="file" :id="`upload${id}`" @change="uploadFile" />
  </div>
</template>

<script setup>
import { getCurrentInstance, reactive, toRefs } from 'vue';
import API from '@/api';

const App = getCurrentInstance()?.appContext.config.globalProperties;

const props = defineProps({
  id: {
    type: [Number, String],
    default: ''
  },
  type: {
    type: Number,
    default: 0
  },
  fileID: {
    type: String,
    default: ''
  }
});

const { id, type, fileID } = toRefs(props);

const state = reactive({
  uploadFiles: {
    fileID: '',
    fileName: '',
    fileUrl: ''
  }
});

const emits = defineEmits(['update:fileID', 'uploadSuccess']);

function uploadClick(params) {
  const fileInput = document.getElementById(params);
  fileInput.click();
}

async function uploadFile(e) {
  const file = e.target.files[0];
  console.log('file ====> ', file);

  try {
    const uploadResult = await API.uploadFile({
      path: `test-todos/${Date.now()}-${file.name}`,
      file
    });
    if (uploadResult.fileID) {
      alert('上传成功');
      const tempUrlResult = await App.$tcb.app.getTempFileURL({ fileList: [uploadResult.fileID] });
      const tempFileUrl = tempUrlResult.fileList[0].tempFileURL;
      console.log('tempFileUrl ===> ', tempFileUrl);

      // 重新上传删除之前的文件
      if (state.uploadFiles.fileID || props.fileID) {
        API.deleteFile([state.uploadFiles.fileID]);
      }

      const result = {
        id: id.value,
        fileID: uploadResult.fileID,
        fileName: file.name,
        fileUrl: tempFileUrl
      };
      state.uploadFiles = result;
      emits('uploadSuccess', result);
    }
  } catch (e) {
    console.error('上传失败：', e);
    alert('上传失败，请重试');
  }
}

async function preview() {
  const fileID = state.uploadFiles.fileID || props.fileID;
  if (!fileID) return alert('请先上传文件');
  const tempUrlResult = await App.$tcb.app.getTempFileURL({ fileList: [fileID] });
  const tempFileUrl = tempUrlResult.fileList[0].tempFileURL;
  if(!tempFileUrl) return alert('文件不存在');
  console.log('tempFileUrl ===> ', tempFileUrl);

  window.open(tempFileUrl);
}
</script>

<style scoped>
.file-view {
  display: inline-flex;
  width: 145px;
  height: auto;
}

.file-input {
  display: none;
}

.file-view button {
  cursor: pointer;
  flex-shrink: 0;
  display: block;
  padding: 10px;
  width: auto;
  height: 40px;
  margin: 5px;
  max-width: 250px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  background: #e0e5ec;
  color: #000;
  /* box-shadow: inset 2px 2px 2px 0px rgb(255 255 255 / 50%), 7px 7px 20px 0px rgb(0 0 0 / 10%), 4px 4px 5px 0px rgb(0 0 0 / 10%); */
}

.file-view button:active {
  transform: translateY(3px);
}
</style>
