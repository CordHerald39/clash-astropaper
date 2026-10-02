import { defineAstroPaperConfig } from "./src/types/config";
export default defineAstroPaperConfig({
 site:{url:process.env.SITE_URL || "https://clashzhinan.com.cn",title:"Clash 中文网",description:"查找 Clash 开发者官网入口，选择安卓与电脑客户端下载，阅读订阅配置、规则分流和故障排查教程。",author:"Clash 中文网编辑部",profile:"https://github.com/CordHerald39/clash-astropaper",ogImage:"",lang:"zh-CN",timezone:"Asia/Shanghai",dir:"ltr"},
 posts:{perPage:6,perIndex:6},features:{lightAndDarkMode:true,dynamicOgImage:false,showArchives:true,showBackButton:true,editPost:{enabled:false},search:"pagefind"},socials:[],shareLinks:[]
});
