import { useEffect, useRef, useState } from "react";
import { Box, LoaderCircle } from "lucide-react";
import type { Artifact } from "./api";
import { modelThumbnail } from "./modelThumbnail";

/** An ordinary image after one render. No animation loop or retained GPU context. */
export default function ModelPreview({ artifact }: { artifact: Artifact }) {
  const container = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setUrl("");
    setError("");
    let dead = false;
    let objectUrl = "";
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      modelThumbnail(artifact).then((blob) => {
        if (dead) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }).catch(() => {
        if (!dead) setError("Preview unavailable. You can still download the GLB.");
      });
    });
    if (container.current) observer.observe(container.current);
    return () => {
      dead = true;
      observer.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [artifact.id, artifact.sha256, artifact.preview_url]);
  return <div ref={container} className="model-preview">
    {url ? <img src={url} alt={artifact.name} className="model-still" /> : error ?
      <div className="preview-message model-preview-error" role="alert"><Box /><p>{error}</p></div> :
      <div className="preview-message" role="status"><LoaderCircle className="spin" /></div>}
  </div>;
}
