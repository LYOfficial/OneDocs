<template>
  <div>
    <SDialog
      :title="$t('feedback')"
      :onCancel="callback"
      :onOK="toLink"
      titleIcon="fas fa-info-circle"
      okText="去github开源仓库"
      width="450px"
    >
      <p>你正在使用OneDocs，基于showdoc魔改的开源文档，如有问题或者建议，请到github提issue：</p>
      <p><a href='https://github.com/LYOfficial/OneDocs/issues' target='_blank'>https://github.com/LYOfficial/OneDocs/issues</a></p>
      <p>如果你觉得OneDocs好用，不妨给开源项目点一个star。</p>
    </SDialog>
  </div>
</template>

<script>
export default {
  name: 'Feedback',
  props: {
    callback: ''
  },
  data() {
    return {
      msg: '反馈'
    }
  },
  methods: {
    async toLink() {
      this.toOutLink('https://github.com/LYOfficial/OneDocs/issues')
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
