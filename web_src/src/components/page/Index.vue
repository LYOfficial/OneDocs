<template>
  <div class="hello" v-if="showComp">
    <Header></Header>

    <div id="header"></div>
    <div class="container doc-container" id="doc-container">
      <div class="doc-title-box">
        <span id="doc-title-span" class="dn"></span>
        <h2 id="doc-title">{{ page_title }}</h2>
        <i
          class="el-icon-full-screen"
          id="full-page"
          v-show="showfullPageBtn"
          @click="clickFullPage"
        ></i>
      </div>
      <div id="doc-body">
        <div id="page_md_content" class="page_content_main">
          <Editormd
            v-bind:content="content"
            v-if="page_id && content"
            type="html"
          ></Editormd>
        </div>
      </div>
    </div>
    <el-backtop right="40" bottom="40"></el-backtop>
    <Toc v-if="page_id && showToc"></Toc>
    <Footer></Footer>
    <div class></div>
  </div>
</template>

<style scoped>
#page_md_content {
  padding: 10px 10px 90px 10px;
  overflow: hidden;
  color: #333;
}

.doc-container {
  position: static;
  -webkit-box-shadow: 0px 1px 6px #ccc;
  -moz-box-shadow: 0px 1px 6px #ccc;
  -ms-box-shadow: 0px 1px 6px #ccc;
  -o-box-shadow: 0px 1px 6px #ccc;
  box-shadow: 0px 1px 6px #ccc;
  background-color: #fff;
  border-bottom: 1px solid #d9d9d9;
  margin-bottom: 20px;
  width: 800px;
  min-height: 500px;
  margin-left: auto;
  margin-right: auto;
  padding: 20px;
}

#header {
  height: 80px;
}

#doc-body {
  width: 90%;
  margin: 0 auto;
  background-color: #fff;
}

.doc-title-box {
  height: auto;
  margin: 30px 100px 10px 100px;
  width: auto;
  border-bottom: 1px solid #ebebeb;
  padding-bottom: 10px;
  width: 90%;
  margin: 10px auto;
}
#doc-title {
  font-size: 1.8em;
}
#footer {
  margin: 0 auto;
  width: 180px;
  font-size: 8px;
  color: #959595;
}

pre ol {
  list-style: none;
}

.markdown-body pre {
  background-color: #f7f7f9;
  border: 1px solid #e1e1e8;
}
.hljs {
  background-color: #f7f7f9;
}

.editormd-html-preview,
.editormd-preview-container {
  padding: 0px;
  font-size: 14px;
}

#full-page {
  float: right;
  font-size: 18px;
  margin-top: -50px;
  margin-right: 30px;
  cursor: pointer;
  color: #ccc;
}
</style>

<script>
import Editormd from '@/components/common/Editormd'
import Toc from '@/components/common/Toc'
import { rederPageContent } from '@/models/page'

export default {
  data() {
    return {
      currentDate: new Date(),
      itemList: {},
      content: '',
      page_title: '',
      page_id: 0,
      fullPage: false,
      showComp: true,
      showfullPageBtn: true,
      showToc: true
    }
  },
  components: {
    Editormd,
    Toc
  },
  methods: {
    getPageContent() {
      var url
      var page_id = this.$route.params.page_id
      var unique_key = this.$route.params.unique_key
      if (unique_key) {
        url = '/api/page/infoByKey'
      } else {
        url = '/api/page/info'
      }
      this.request(
        url,
        {
          page_id: page_id,
          unique_key: unique_key
        },
        'post',
        false
      ).then(data => {
        if (data.error_code === 0) {
          this.content = rederPageContent(data.data.page_content)
          this.page_title = data.data.page_title
          this.page_id = data.data.page_id
          document.title = data.data.page_title
        } else if (data.error_code === 10307 || data.error_code === 10303) {
          // 需要输入密码
          this.$router.replace({
            path: '/item/password/0',
            query: {
              page_id: page_id,
              redirect: this.$router.currentRoute.fullPath
            }
          })
        } else {
          alert(data.error_message)
        }
      })
    },
    adaptToMobile() {
      var doc_container = document.getElementById('doc-container')
      doc_container.style.width = '95%'
      doc_container.style.padding = '5px'
      var header = document.getElementById('header')
      header.style.height = '10px'
      this.showToc = false
    },
    clickFullPage() {
      // 点击放大页面。由于历史包袱，只能操作dom。这是不规范的，但是现在没时间重构整块页面
      if (this.fullPage) {
        // 通过v-if指令起到刷新组件的作用
        this.showComp = false
        this.$nextTick(() => {
          this.showComp = true
          this.showToc = true
        })
      } else {
        this.adaptToMobile()
        // 切换变量让它重新加载、渲染子组件
        var page_id = this.page_id
        this.page_id = 0
        this.$nextTick(() => {
          this.page_id = page_id
          setTimeout(() => {
            $('.editormd-html-preview').css('font-size', '16px')
          }, 200)
        })
      }
      this.fullPage = !this.fullPage
    }
  },
  mounted() {
    this.getPageContent()
    // 根据屏幕宽度进行响应(应对移动设备的访问)
    if (this.isMobile() || window.screen.width < 1000) {
      this.$nextTick(() => {
        this.showfullPageBtn = false
        this.adaptToMobile()
      })
    }
  },
  beforeDestroy() {
    document.title = 'OneDocs'
  }
}
</script>
