import React from "react";

const ImageComp = ({ src, alt, className,...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
        {...props}
    />
  );
};

export default ImageComp;