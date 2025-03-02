import React, { useState, useEffect } from "react";
import "./PizzaImageLoadingScreen.css";

const PizzaImageLoadingScreen = () => {
  const [sliceState, setSliceState] = useState(0);
  const [loadingText, setLoadingText] = useState(
    "Finding delicious recipes for you...",
  );

  const loadingMessages = [
    "Finding delicious recipes for you...",
    "Scanning the cookbook database...",
    "Checking ingredient combinations...",
    "Analyzing flavor profiles...",
    "Preparing your perfect meal suggestions...",
    "Almost ready to serve!",
  ];

  useEffect(() => {
    // Handle slice animation
    const sliceInterval = setInterval(() => {
      setSliceState((prev) => (prev >= 8 ? 0 : prev + 1));
    }, 1250);

    // Handle text changes
    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 1600);

    return () => {
      clearInterval(sliceInterval);
      clearInterval(textInterval);
    };
  }, []);

  // Create exactly 8 evenly-spaced slices
  const slices = Array(8)
    .fill(0)
    .map((_, i) => {
      const startAngle = i * 45;
      const endAngle = (i + 1) * 45;

      return {
        index: i,
        rotation: startAngle,
        pullDirection: startAngle + 22.5, // Middle of the slice angle
        pullDistance: 40,
      };
    });

  return (
    <div className="loading-container">
      <div className="pizza-container">
        {/* Pizza Base - Only visible if all slices are removed */}
        <div className="pizza-base">
          <img
            src="/pizza-removebg-preview.png"
            alt="Pizza Base"
            className="pizza-base-img"
          />
        </div>

        {/* Pizza slices */}
        {slices.map((slice) => {
          const isRemoved = slice.index < sliceState;

          // Calculate position for pulled slices
          const radians = (slice.pullDirection * Math.PI) / 180;
          const translateX = isRemoved
            ? Math.cos(radians) * slice.pullDistance
            : 0;
          const translateY = isRemoved
            ? Math.sin(radians) * slice.pullDistance
            : 0;

          // Calculate clip path for perfect triangle slice
          const startAngle = slice.rotation;
          const endAngle = startAngle + 45;

          // Convert to coordinates for clip-path
          const startRadians = (startAngle * Math.PI) / 180;
          const endRadians = (endAngle * Math.PI) / 180;

          const startX = 50 + 50 * Math.cos(startRadians);
          const startY = 50 + 50 * Math.sin(startRadians);
          const endX = 50 + 50 * Math.cos(endRadians);
          const endY = 50 + 50 * Math.sin(endRadians);

          return (
            <div
              key={slice.index}
              className="pizza-slice"
              style={{
                opacity: isRemoved ? 0 : 1,
                transform: `translate(${translateX}px, ${translateY}px)`,
                clipPath: `polygon(50% 50%, ${startX}% ${startY}%, ${endX}% ${endY}%)`,
                zIndex: isRemoved ? 10 : 1,
              }}
            >
              {/* Individual slice image */}
              <img
                src="/pizza-removebg-preview.png"
                alt={`Pizza Slice ${slice.index + 1}`}
                className="pizza-slice-img"
              />
            </div>
          );
        })}
      </div>

      <p className="loading-text">{loadingText}</p>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${(sliceState / 8) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PizzaImageLoadingScreen;
