# 地图模块

## 概述

地图模块是 Matrx Windows 客户端的位置分享与展示功能，集成 Google Maps JavaScript API 实现地图渲染和位置标记。该模块支持两种使用场景：在 IM 聊天消息中以卡片形式展示位置信息（内嵌小地图），以及点击卡片后在独立窗口中展示完整的交互式地图。模块采用独立渲染进程架构，地图窗口作为一个单独的 BrowserWindow 运行，通过 IPC 通信接收位置数据。

## 核心文件结构

```
src/
├── components/
│   ├── Map/
│   │   └── Map.vue                    # 地图核心组件
│   └── Chat/
│       └── MapView.vue                # IM 聊天地图消息卡片
├── renderer/
│   └── mapWin/
│       ├── index.js                   # 地图窗口 Vue 入口
│       ├── Index.vue                  # 地图窗口根组件
│       └── assets/
│           └── map/
│               └── icon_location.svg  # 位置标记图标
└── buildConfig/
    └── currentConfig.js               # 包含 mapKey 配置
```

## 详细代码分析

### 1. Map.vue - 地图核心组件

`Map.vue` 是地图模块的核心渲染组件，封装了 Google Maps JavaScript API 的初始化、地图创建和标记点设置。该组件被聊天卡片和独立窗口共同复用。

```javascript
// src/components/Map/Map.vue
const currentConfig = require('@/buildConfig/currentConfig');

export default {
    name: 'Map',
    props: {
        query: {
            type: Object,       // { lat, lng, poiName, poiAddress }
            required: true
        },
        isMapView: {
            type: Boolean,      // 是否为卡片模式（禁用手势交互）
            default: false
        },
        isReply: {
            type: Boolean,      // 是否在回复消息中
            default: false
        },
        isMine: {
            type: Boolean,      // 是否是自己发送的
            default: false
        },
        uuid: {
            type: String,       // 地图实例唯一标识
            default: ''
        }
    },
    data() {
        return {
            loading: true       // 地图加载中状态
        };
    }
};
```

#### Google Maps 初始化

地图初始化采用动态脚本注入方式加载 Google Maps SDK：

```javascript
initScript() {
    // 1. 检查 mapKey 配置
    if (!currentConfig.mapKey) {
        sendLog('mapKey null');
        this.$message({ type: 'warning', message: this.$t('map.map_fail') });
        return;
    }

    // 2. 如果 Google Maps 已加载，直接初始化
    if (window.google?.maps) {
        this.initMap();
        return;
    }

    // 3. 动态注入 Google Maps 脚本
    var script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${currentConfig.mapKey}&callback=initMap`;
    script.async = true;
    window.initMap = this.initMap;
    document.head.appendChild(script);
}
```

#### 地图创建与标记

```javascript
async initMap() {
    const position = { lat: this.query.lat, lng: this.query.lng };

    // 处理字符串类型的经纬度
    if (typeof position.lat === 'string') position.lat = position.lat - 0;
    if (typeof position.lng === 'string') position.lng = position.lng - 0;

    // 加载 Google Maps 库
    const { Map } = await google.maps.importLibrary('maps');
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

    // 创建地图实例
    map = new Map(this.$refs.map, {
        zoom: 13,
        center: position,
        mapId: 'map-win' + this.uuid,
        mapTypeControl: false,       // 隐藏地图类型切换
        zoomControl: false,          // 隐藏缩放控件
        scaleControl: false,         // 隐藏比例尺
        gestureHandling: this.isMapView ? 'none' : '',  // 卡片模式禁用手势
        streetViewControl: false,    // 隐藏街景
        fullscreenControl: false     // 隐藏全屏按钮
    });

    // 添加自定义位置标记
    const beachFlagImg = document.createElement('img');
    beachFlagImg.src = icon_location;

    new AdvancedMarkerElement({
        map: map,
        position: position,
        content: beachFlagImg,       // 使用自定义图标
        title: this.query.poiName
    });

    this.loading = false;
}
```

地图配置根据使用场景有所不同：

| 配置项 | 卡片模式 (`isMapView: true`) | 独立窗口模式 |
|--------|---------------------------|-------------|
| `gestureHandling` | `'none'`（禁用所有手势） | `''`（默认行为） |
| `zoom` | 13 | 13 |
| 地图控件 | 全部隐藏 | 全部隐藏 |

#### 位置信息展示

地图下方叠加显示位置名称和详细地址：

```html
<div :class="['mark-info', isReply && 'active', isMine && 'self']">
    <h2 class="ellipsis">{{ query.poiName }}</h2>
    <p v-if="query.poiAddress">{{ query.poiAddress }}</p>
</div>
```

位置信息栏的背景色根据消息类型变化：
- 默认：白色（`--grey-0`）
- 回复消息中：浅灰（`--grey-1`）
- 自己发送 + 回复消息：浅蓝（`#c5ddfb`）
- 自己发送：银蓝（`--mv2-SilverBlue-SilverBlue3`）

#### 数据变化监听

组件监听 `query` prop 的变化，当位置数据更新时重新初始化地图：

```javascript
watch: {
    query: {
        deep: true,
        handler(n, o) {
            if (JSON.stringify(n) !== JSON.stringify(o)) {
                this.initScript();
            }
        }
    }
}
```

### 2. MapView.vue - IM 聊天地图卡片

`MapView.vue` 将位置消息以地图卡片的形式嵌入聊天消息流，使用 `ChatWarp` 组件包裹以获得统一的消息气泡样式。

```javascript
// src/components/Chat/MapView.vue
export default {
    name: 'MapView',
    components: { ChatWarp, Map },
    props: {
        chatInfo: { type: Object, required: true },
        isSubscribe: { type: Boolean, required: false },
        groupPinVisable: Boolean,
        isGroupPinHover: Boolean
    }
};
```

#### 消息数据解析

位置数据从消息的 `meta` 字段中提取：

```javascript
mounted() {
    const meta = this.chatInfo.plainMsg.m.meta;
    this.query = {
        lat: meta.poiLatitude,       // 纬度
        lng: meta.poiLongitude,      // 经度
        poiName: meta.poiName,       // 位置名称
        poiAddress: meta.poiAddress  // 详细地址
    };
}
```

位置消息的 `meta` 结构：

```json
{
    "poiName": "位置名称",
    "poiAddress": "详细地址",
    "poiLongitude": "经度",
    "poiLatitude": "纬度",
    "poiThumbnailUrl": "缩略图url"
}
```

#### 卡片点击打开独立窗口

点击卡片通过 IPC 通知主进程打开地图独立窗口，使用 lodash throttle 限制点击频率：

```javascript
clickCard: throttle(
    function () {
        ipcRenderer.send('map-window-main', {
            type: 'show',
            args: { ...this.query }
        });
    },
    1000,
    { trailing: false }
)
```

卡片固定尺寸为 300x244 像素，地图以 `isMapView: true` 模式渲染（禁用手势交互），位置信息栏字体缩小为 14px。

### 3. mapWin 渲染进程 - 独立地图窗口

#### index.js - Vue 实例入口

```javascript
// src/renderer/mapWin/index.js
import Vue from 'vue';
import App from '@/renderer/mapWin/Index.vue';
import '@/styles/variables.css';
import '@/styles/style.scss';
import 'element-ui/lib/theme-chalk/index.css';
import '@/config/element.config.js';
import i18n from '@/lang';

new Vue({
    i18n,
    render: h => h(App)
}).$mount('#app');
```

地图窗口作为独立渲染进程启动，加载了完整的样式系统（CSS 变量、SCSS、Element UI）和国际化配置。

#### Index.vue - 窗口根组件

```javascript
// src/renderer/mapWin/Index.vue
export default {
    name: 'MapIndex',
    components: { Map },
    data() {
        return {
            title: '',
            query: null
        };
    },
    mounted() {
        // 设置窗口标题
        document.title = this.$t('map.location');

        // 监听主进程发送的位置数据
        ipcRenderer.on('map-win-query', (event, data) => {
            this.query = data;
        });

        // 设置 RTL 方向（阿拉伯语支持）
        document.documentElement.setAttribute('dir',
            this.$i18n.locale === 'ar' ? 'rtl' : 'ltr');
    }
};
```

窗口根组件通过 `ipcRenderer.on('map-win-query')` 接收位置数据，数据到达后 `Map` 组件开始渲染。

## IPC 通信流程

```
聊天消息卡片 (MapView.vue)
    │
    │  点击卡片
    │  ipcRenderer.send('map-window-main', { type: 'show', args: query })
    │
    ▼
主进程 (main process)
    │
    │  创建或显示地图 BrowserWindow
    │  mapWin.webContents.send('map-win-query', args)
    │
    ▼
地图窗口 (mapWin/Index.vue)
    │
    │  ipcRenderer.on('map-win-query', (event, data) => { this.query = data })
    │
    ▼
Map.vue
    │
    │  initScript() → Google Maps API 加载
    │  initMap() → 创建地图 + 添加标记
    │
    ▼
地图渲染完成
```

## 位置消息数据模型

```javascript
// 位置消息在 IM 中的结构
{
    plainMsg: {
        m: {
            meta: {
                poiName: "Abu Dhabi Mall",           // 位置名称
                poiAddress: "10th Street, Abu Dhabi", // 详细地址
                poiLongitude: "54.3773",              // 经度
                poiLatitude: "24.4539",               // 纬度
                poiThumbnailUrl: "https://..."        // 缩略图 URL
            },
            uuid: "msg-uuid-123"                     // 消息唯一标识
        },
        isMine: true                                 // 是否自己发送
    }
}
```

## 配置依赖

地图模块依赖以下外部配置：

| 配置项 | 来源 | 说明 |
|--------|------|------|
| `mapKey` | `src/buildConfig/currentConfig.js` | Google Maps API Key |
| `icon_location.svg` | `src/assets/map/` 或 `src/renderer/mapWin/assets/map/` | 自定义位置标记图标 |
| `i18n: map.location` | `src/lang/locales/` | 窗口标题国际化文本 |
| `i18n: map.map_fail` | `src/lang/locales/` | 地图加载失败提示文本 |

## 组件复用关系

```
Map.vue (核心地图组件)
    │
    ├── MapView.vue (聊天卡片)
    │     └── ChatWarp.vue (消息气泡包装)
    │           - 卡片模式：isMapView=true, 300x244px
    │           - 禁用手势交互
    │           - 点击打开独立窗口
    │
    └── mapWin/Index.vue (独立窗口)
          - 完整交互模式：isMapView=false
          - 支持拖拽、缩放等地图操作
          - 通过 IPC 接收位置数据
```
