import Scrollbars, { ScrollbarProps } from "react-custom-scrollbars-2";

import styles from "./MiniMapScrollbar.module.scss";

export default function MinimapScrollbar(props: ScrollbarProps) {
  return (
    <Scrollbars
      renderTrackHorizontal={(props) => (
        <div {...props} className={styles["track-horizontal"]} />
      )}
      renderTrackVertical={(props) => (
        <div
          {...props}
          style={{ ...props.style, ...{ width: 20 } }}
          className={styles["track-vertical"]}
        />
      )}
      renderThumbHorizontal={(props) => (
        <div {...props} className={styles["thumb-horizontal"]} />
      )}
      renderThumbVertical={(props) => (
        <div {...props} 
        className={styles["thumb-vertical"]}
         />
      )}
      // renderView={(props) => <div {...props} className={styles["view"]} />}
      {...props}
    />
  );
}
