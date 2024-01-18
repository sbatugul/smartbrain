import React from "react";
import "./FaceRecognition.css";

const FaceRecognition = ({ imageUrl, boxes }) => {
  // Ensure that boxes is an array before trying to map
  if (!Array.isArray(boxes)) {
    return null; // or handle it in some other way based on your application logic
  }

  return (
    <div className="center ma">
      <div className="absolute mt2">
        <img id="inputimage" src={imageUrl} alt="" width="500px" height="auto" />
        {boxes.map((box, index) => (
          <div
            key={index}
            className="bounding-box"
            style={{
              top: box.topRow,
              right: box.rightCol,
              bottom: box.bottomRow,
              left: box.leftCol
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default FaceRecognition;
