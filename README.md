# 钓虾业务系统管理后台

## 项目简介

钓虾业务系统的运营管理后台，面向工作人员提供数据看板、门店与员工管理、席位和预约管理、会员管理、订单商城及财务运营等能力。

## 技术栈

- Vue 3、Vite、Vue Router
- Element Plus、Pinia、Axios
- ECharts、Sass、Vite 自动导入与压缩插件

## 关联仓库

| 仓库 | 职责 | 与本仓库的关系 |
| --- | --- | --- |
| [diaoxia-backend](https://github.com/jiangyi3265/diaoxia-backend) | 后端服务 | 为本后台提供认证、业务 API 与数据支撑 |
| [diaoxia-admin](https://github.com/jiangyi3265/diaoxia-admin) | 管理后台 | 当前仓库，供运营人员管理业务数据与配置 |
| [diaoxia-app](https://github.com/jiangyi3265/diaoxia-app) | 用户端 | 与本后台共享同一后端服务，分别服务用户与运营人员 |

## 快速启动

```bash
npm install
npm run dev
```

启动后，将开发服务器中的 API 代理或接口基地址配置为已启动的 [diaoxia-backend](https://github.com/jiangyi3265/diaoxia-backend) 服务。生产构建：

```bash
npm run build:prod
```

## 简历描述示例

负责钓虾业务运营后台的前端开发，使用 Vue 3、Vite、Element Plus 与 Pinia 搭建模块化管理界面，覆盖预约、会员、门店、订单及经营数据等核心场景。
