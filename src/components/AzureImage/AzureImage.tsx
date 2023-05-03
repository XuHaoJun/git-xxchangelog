import Image from "next/image";
import { useState } from "react";

import { useTauriLibs2 } from "@/hooks/tauri/tauriLibs.hook";
import { useEffect } from "react";
import { useRootStore } from "@/stores/root.store";
import { shallow } from "zustand/shallow";

const AzureImage = ((props: any) => {
  const { tauriLibs } = useTauriLibs2();
  const [src, setSrc] = useState("");
  const [accessToken] = useRootStore(
    (rootStore) => rootStore.settings,
    (state) => [state.settings.azureDevOps.accessToken],
    shallow
  );
  useEffect(() => {
    (async () => {
      const basicToken = Buffer.from(`:${accessToken}`).toString("base64");
      const resp = await tauriLibs.http.fetch(props.src, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicToken}`,
        },
        responseType: tauriLibs.http.ResponseType.Binary,
      });
      if (resp.ok) {
        const u8data = new Uint8Array(resp.data as any);
        const b = new Blob([u8data] as any, {
          type: resp.headers["content-type"],
        });
        const url = window.URL.createObjectURL(b);
        setSrc(url);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.src]);
  return (
    Boolean(src) && (
      // eslint-disable-next-line jsx-a11y/alt-text
      <Image
        {...props}
        src={src}
        style={{
          height: "100%",
          width: "auto",
        }}
      />
    )
  );
}) as unknown as typeof Image;

export default AzureImage;
