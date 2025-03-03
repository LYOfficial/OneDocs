<template>
  <div class="body">
    <!--header-->
    <div class="header">
      <div class="header-wrap">
        <a href="/">
          <div class="logo">
            <img class="logo-img" src="@/assets/Logo.svg" />
            <span class="logo-title">OneDocs</span>
          </div>
        </a>
        <input type="checkbox" name id="mobile-menu-toggle" value />
        <label class="gh" for="mobile-menu-toggle">
          <span></span>
        </label>
        <div class="nav">
          <ul>
            <li>
              <router-link :to="link">{{ link_text }}</router-link>
            </li>
            
          </ul>
        </div>
      </div>
    </div>

    <div class="hbanner">
      <div class="wrapper">
        <div class="hbanner-txt">
          <h2>
            {{ $t('section_description1_1') }}
            <br />
            <font class="f-blue">{{ $t('section_description1_2') }}</font>
          </h2>
          <div class="btns">
            <a
              href="https://onedocs.cn/demo"
              target="_blank"
              class="btn on"
              >{{ $t('demo') }}</a
            >
            <a href="https://onedocs.cn/help" target="_blank" class="btn">{{
              $t('more')
            }}</a>
          </div>
        </div>
        <div class="hbanner-imgs"></div>
      </div>
    </div>
      <div class="copyright">
        <a href="https://beian.miit.gov.cn/">{{ beian }}</a>
      </div>
    </div>
  </div>
</template>

<script>
import { getUserInfo } from '@/models/user'
export default {
  name: 'Index',
  data() {
    return {
      height: '',
      link: '',
      link_text: '',
      beian: ''
    }
  },
  methods: {
    getHeight() {
      var winHeight
      if (window.innerHeight) {
        winHeight = window.innerHeight
      } else if (document.body && document.body.clientHeight) {
        winHeight = document.body.clientHeight
      }
      this.height = winHeight + 'px'
    },
    homePageSetting() {
      var url = '/api/common/homePageSetting'
      this.request(url, this.form,'post',false).then(data => {
        if (data.error_code === 0) {
          this.beian = data.data.beian
          if (data.data.home_page == 2) {
            // 跳转到登录页面
            this.$router.replace({
              path: '/user/login'
            })
          }
          if (
            data.data.home_page == 3 &&
            data.data.home_item
          ) {
            // 跳转到指定项目
            this.$router.replace({
              path: '/' + data.data.home_item
            })
          }
        }
      })
    }
  },
  mounted() {
    this.getHeight()
    this.homePageSetting()
    this.link = '/user/login'
    this.link_text = this.$t('index_login_or_register')
    getUserInfo(data => {
      if (data.error_code === 0) {
        this.link = '/item/index'
        this.link_text = this.$t('my_item')
      }
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped src="@/../static/css/qietu.css"></style>
<style scoped src="@/../static/css/style.css"></style>
<style scoped src="@/../static/css/responsive.css"></style>
<style scoped>
.case-logo img {
  width: 200px;
  padding: 20px;
}
</style>
