import Image from "next/image";
import { publicFileExists } from "@/lib/media";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 首页的照片拼贴。
 *
 * 版式用「容器定比例 + 子项百分比定位」：四张照片的位置、大小、旋转角都按容器
 * 宽高的百分比写死，所以从手机到桌面缩放时，整组照片的相对关系完全不变 ——
 * 换成断点各写一套的话，中间尺寸一定会错位。
 *
 * 手写标注单独渲染成一层，不放在 figure 里面：figure 带 rotate，会生成独立的
 * 层叠上下文，塞在里面的标注只能跟着自己那张照片的 z-index 走，必然被压在上层
 * 照片下面（实测「Sydney」只剩「Sy」）。提成一层之后它永远在最上面。
 *
 * 照片没补进来之前整块不渲染，不留裂图。
 */

/**
 * photo: 照片本身的位置。left / width 是容器宽度的百分比，top 是容器高度的百分比。
 * note:  手写标注的位置，独立于照片，挑的是四周的空处。
 */
const layout = [
  {
    photo: { left: 0, top: 10, width: 33, rotate: -3, z: 2 },
    note: { left: 0, top: 1 }
  },
  {
    photo: { left: 29, top: 4, width: 37, rotate: 2, z: 1 },
    note: { left: 68, top: 10 }
  },
  {
    photo: { left: 6, top: 56, width: 43, rotate: 1.5, z: 4 },
    note: { left: 4, top: 98 }
  },
  {
    photo: { left: 57, top: 36, width: 33, rotate: -2, z: 3 },
    // 这张几乎占满容器高度（top 36% + 自身高度 ≈ 99%），标注只能放到容器下方，
    // 否则灰字压在浅色照片上读不出来。
    note: { left: 62, top: 101 }
  }
];

export function hasCollagePhotos() {
  return personalSiteContent.home.collage.some((photo) => publicFileExists(photo.src));
}

export function PhotoCollage() {
  const photos = personalSiteContent.home.collage.filter((photo) =>
    publicFileExists(photo.src)
  );

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="photo-collage" role="group" aria-label="生活照片">
      {photos.map((photo, index) => {
        const { photo: place } = layout[index % layout.length];

        return (
          <figure
            className="collage-item"
            key={photo.src}
            style={{
              left: `${place.left}%`,
              top: `${place.top}%`,
              width: `${place.width}%`,
              zIndex: place.z,
              transform: `rotate(${place.rotate}deg)`
            }}
          >
            <Image
              alt={photo.alt}
              height={photo.height}
              sizes="(max-width: 640px) 45vw, 200px"
              src={photo.src}
              width={photo.width}
            />
          </figure>
        );
      })}

      {photos.map((photo, index) => {
        const { note } = layout[index % layout.length];

        return (
          <span
            aria-hidden="true"
            className="collage-note"
            key={`${photo.src}-note`}
            style={{ left: `${note.left}%`, top: `${note.top}%` }}
          >
            {photo.note}
          </span>
        );
      })}
    </div>
  );
}
