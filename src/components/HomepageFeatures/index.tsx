import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
};

const ClaudeDocWinList: FeatureItem[] = [
  {
    title: "桌面端App",
    // name: 'Matrix Windows',
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: <>Description for 桌面端App (Matrix Windows).</>,
  },
  // {
  //   title: 'Electron包',
  //   // name: 'avr_electron',
  //   Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
  //   description: (
  //     <>
  //       Description for Electron包 (avr_electron).
  //     </>
  //   ),
  // },
  // {
  //   title: '日志解密',
  //   // name: 'Entry Log',
  //   Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
  //   description: (
  //     <>
  //       Description for 日志解密 (Entry Log).
  //     </>
  //   ),
  // },
  // {
  //   title: '日志解密',
  //   // name: 'Matrix Player',
  //   Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
  //   description: (
  //     <>
  //       Description for 日志解密 (Matrix Player).
  //     </>
  //   ),
  // },
  // {
  //   title: '办公工具',
  //   // name: 'Office Excel',
  //   Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
  //   description: (
  //     <>
  //       Description for 办公工具 (Office Excel).
  //     </>
  //   ),
  // },
  // {
  //   title: '项目',
  //   // name: 'Almualm',
  //   Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
  //   description: (
  //     <>
  //       Description for 项目 (Almualm).
  //     </>
  //   ),
  // },
  // {
  //   title: '桌面端SDK',
  //   // name: 'CST SDK',
  //   Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
  //   description: (
  //     <>
  //       Description for 桌面端SDK (CST SDK).
  //     </>
  //   ),
  // },
  // {
  //   title: '桌面端SDK',
  //   // name: 'Falah',
  //   Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
  //   description: (
  //     <>
  //       Description for 桌面端SDK (Falah).
  //     </>
  //   ),
  // },
  // {
  //   title: '直播App',
  //   // name: 'Live Webview',
  //   Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
  //   description: (
  //     <>
  //       Description for 直播App (Live Webview).
  //     </>
  //   ),
  // },

  // {
  //   title: '聊天SDK',
  //   // name: 'Web IM SDK',
  //   Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
  //   description: (
  //     <>
  //       Description for 聊天SDK (Web IM SDK).
  //     </>
  //   ),
  // },
  // {
  //   title: '会议SDK',
  //   // name: 'Web Meeting SDK',
  //   Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
  //   description: (
  //     <>
  //       Description for 会议SDK (Web Meeting SDK).
  //     </>
  //   ),
  // },
  // {
  //   title: '风险来源平台',
  //   // name: 'MSS',
  //   Svg: require('@site/static/img/draw_web_mss.svg').default,
  //   description: (
  //     <>
  //       Description for 风险来源平台 (MSS).
  //     </>
  //   ),
  // },
  // {
  //   title: '风险来源平台',
  //   // name: 'Conf Portal',
  //   Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
  //   description: (
  //     <>
  //       Description for 风险来源平台 (Conf Portal).
  //     </>
  //   ),
  // },
];

const ClaudeDocWebList: FeatureItem[] = [
  {
    title: "首页",
    // name: 'Home',
    Svg: require("@site/static/img/draw_web_home.svg").default,
    description: <>Description for 首页 (Home).</>,
  },
  {
    title: "会中管理",
    // name: 'Meeting Control',
    Svg: require("@site/static/img/draw_web_meeting.svg").default,
    description: <>Description for 会中管理 (Meeting Control).</>,
  },
  {
    title: "会前管理",
    // name: 'Meeting',
    Svg: require("@site/static/img/draw_web_meeting.svg").default,
    description: <>Description for 会前管理 (Meeting).</>,
  },
  {
    title: "公共模块",
    // name: 'Module Common',
    Svg: require("@site/static/img/draw_web_module.svg").default,
    description: <>Description for 公共模块 (Module Common).</>,
  },
  {
    title: "本地代理",
    // name: 'Proxy Local',
    Svg: require("@site/static/img/draw_web_proxy.svg").default,
    description: <>Description for 本地代理 (Proxy Local).</>,
  },
];
function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {ClaudeDocWinList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        <div className="row">
          {ClaudeDocWebList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
