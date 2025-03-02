"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import React from "react";
import door from "./Door2.png"; // Import the image
import doorI from "./Rectangle 1.png";
import "./NewLandingPage.css";
import { Button } from "../../common";

export default function ScrollLinked() {
  const { scrollYProgress } = useScroll();
  const navigate = useNavigate();

  // Transform scroll progress into image scale and button opacity
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.5, 16]); // Image scales from 0.5x to 4x as user scrolls
  const buttonOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]); // Buttons fade out as user scrolls past 50%

  // Transform for door interior rotation - starts closed (0deg) and opens to 105deg as user scrolls
  const doorRotation = useTransform(scrollYProgress, [0, 0.1], [0, -180]);

  return (
    <>
      {/* Custom Image */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%", // Ensures full width for centering
          display: "flex",
          justifyContent: "center",
          zIndex: 1,
          perspective: "1200px", // Add perspective for better 3D effect
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* First image - door base */}
          <motion.img
            src={door}
            alt="Door Base"
            style={{
              scale: imageScale,
              width: "200px",
              height: "auto",
              transformOrigin: "bottom", // Ensures scaling is anchored at the bottom
              position: "relative",
            }}
          />

          {/* Container for door interior to handle scaling */}
          <motion.div
            style={{
              scale: imageScale,
              transformOrigin: "bottom", // Scale from the bottom
              position: "absolute",
              left: "10px", // Slight adjustment to the left
              bottom: "-5px", // Lift up a bit from the bottom
            }}
          >
            {/* Second image - door interior with rotation */}
            <motion.img
              src={doorI}
              alt="Door Interior"
              style={{
                width: "180px",
                height: "auto",
                rotateY: doorRotation, // Apply rotation around Y axis
                transformOrigin: "left", // Set rotation origin to left edge
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Title and Subtitle */}
      <motion.div
        style={{
          opacity: buttonOpacity, // Fade out based on scroll progress
          position: "fixed",
          top: "50%", // Adjust this value to place the title and subtitle higher
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2, // Title and subtitle are above the image
          textAlign: "center",
        }}
      >
        <h1 style={{ 
          fontSize: "3rem", 
          marginBottom: "15px", 
          color: "white",
          textShadow: "4px 4px 8px rgba(0, 0, 0, 0.8)" // Added text shadow
        }}>
          Welcome to PantryPal
        </h1>
        <p style={{ 
          fontSize: "1.2rem", 
          color: "white",
          textShadow: "2px 2px 5px rgba(0, 0, 0, 0.8)" // Added text shadow
        }}>
          Your one stop shop to stopping food waste
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        style={{
          opacity: buttonOpacity, // Fade out based on scroll progress
          position: "fixed",
          bottom: "25%", // Adjust this value to place the buttons lower
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2, // Buttons are above the image
          display: "flex",
          gap: "20px",
        }}
      >
        <Button
          onClick={() => navigate("/signin")}
        >
          Log In
        </Button>
        <Button
          onClick={() => navigate("/signup")}
        >
          Register
        </Button>
      </motion.div>

      {/* Content with Card Animations */}
      <Content />
    </>
  );
}

/**
 * ==============   Utils   ================
 */
function Content() {
  // Hardcoded dark colors for the cards
  const navigate = useNavigate();

  const foodWasteFacts = [
    "In the U.S., 30-40% of the food supply is wasted, which is more than 133 billion pounds of food per year.",
    "Food waste is the single largest category of material placed in municipal landfills.",
    "The average American family of four throws out $1,600 in produce annually.",
    "Reducing food waste by just 15% could feed more than 25 million Americans every year.",
  ];

  // Hardcoded text placement for each row (index of the card that contains text)
  const textPlacement = [2, 0, 3, 1]; // Text appears in the 3rd, 1st, 4th, and 2nd cards respectively

  // Hardcoded color order for each row (to make it look random)
  const colorOrder = [
    ["var(--coffee-medium)", "var(--coffee-dark)", "var(--accent-primary)", "var(--coffee-light)"],
    ["var(--accent-secondary)", "var(--success)", "var(--coffee-espresso)", "var(--warning)"],
    ["var(--error)", "var(--coffee-light)", "var(--coffee-medium)", "var(--coffee-dark)"],
    ["var(--coffee-dark)", "var(--accent-primary)", "var(--accent-secondary)", "var(--success)"],
  ];

  // Hardcoded dimensions for each card [width, height]
  const cardDimensions = [
    ["22%", "120px"], // Row 1, Card 1
    ["24%", "200px"], // Row 1, Card 2 (taller)
    ["20%", "140px"], // Row 1, Card 3
    ["23%", "180px"], // Row 1, Card 4 (taller)
    ["21%", "160px"], // Row 2, Card 1 (taller)
    ["23%", "130px"], // Row 2, Card 2
    ["22%", "220px"], // Row 2, Card 3 (much taller)
    ["24%", "150px"], // Row 2, Card 4
    ["23%", "170px"], // Row 3, Card 1 (taller)
    ["20%", "120px"], // Row 3, Card 2
    ["22%", "190px"], // Row 3, Card 3 (taller)
    ["24%", "140px"], // Row 3, Card 4
    ["21%", "210px"], // Row 4, Card 1 (much taller)
    ["23%", "130px"], // Row 4, Card 2
    ["22%", "160px"], // Row 4, Card 3 (taller)
    ["20%", "140px"], // Row 4, Card 4
  ];

  return (
    <div
      style={{
        marginTop: "200vh",
        padding: "20px",
        position: "relative",
        zIndex: 3,
      }}
    >
      {[1, 2, 3, 4].map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {/* Horizontal Line */}
          {rowIndex > 0 && (
            <div
              style={{
                width: "100%",
                borderBottom: "10px solid #422917", // Thicker brown line
                marginBottom: "90px", // Increased spacing between line and card
              }}
            />
          )}

          {/* Card Row */}
          <motion.div
            initial={{ opacity: 0, x: -100 }} // Start off-screen to the left
            whileInView={{ opacity: 1, x: 0 }} // Animate to the center
            viewport={{ once: true, amount: 0.5 }} // Adjust the threshold for when cards animate
            transition={{ delay: rowIndex * 0.2, duration: 0.5 }}
            style={{
              display: "flex",
              gap: "20px", // Space between cards
              justifyContent: "space-between", // Distribute cards evenly
              marginBottom: "3px", // Add margin after each row
              alignItems: "flex-end", // Align cards to the bottom
            }}
          >
            {/* Cards in the Row */}
            {[0, 1, 2, 3].map((card, cardIndex) => {
              const dimensionIndex = rowIndex * 4 + cardIndex; // Calculate index for dimensions
              const isLoginCard = rowIndex === 2 && cardIndex === 1;
              const isSignupCard = rowIndex === 2 && cardIndex === 2;
              return (
                <div
                  key={cardIndex}
                  style={{
                    background: colorOrder[rowIndex][cardIndex], // Use hardcoded color order
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    width: cardDimensions[dimensionIndex][0], // Hardcoded width
                    height: cardDimensions[dimensionIndex][1], // Hardcoded height
                    color: "white", // Ensure text is readable on dark backgrounds
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: (isLoginCard || isSignupCard) ? "pointer" : "default",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    ...(isLoginCard || isSignupCard) && {
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)",
                      }
                    }
                  }}
                  onClick={() => {
                    if (isLoginCard) navigate("/signin");
                    if (isSignupCard) navigate("/signup");
                  }}
                >
                  {/* Add text to the specified card in the row */}
                  {cardIndex === textPlacement[rowIndex] && (
                    <div>
                      <p>{foodWasteFacts[rowIndex]}</p>
                    </div>
                  )}
                  
                  {/* Add login button to row 3, card 2 */}
                  {isLoginCard && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ 
                        fontSize: "24px", 
                        marginBottom: "15px",
                        fontWeight: "bold" 
                      }}>
                        Already a member?
                      </div>
                      <button
                        style={{
                          backgroundColor: "var(--coffee-dark)",
                          color: "white",
                          border: "2px solid white",
                          padding: "10px 20px",
                          borderRadius: "6px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--coffee-espresso)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--coffee-dark)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        Log In
                      </button>
                    </div>
                  )}
                  
                  {/* Add signup button to row 3, card 3 */}
                  {isSignupCard && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ 
                        fontSize: "24px", 
                        marginBottom: "15px",
                        fontWeight: "bold" 
                      }}>
                        New to PantryAI?
                      </div>
                      <button
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          color: "white",
                          border: "2px solid white",
                          padding: "10px 20px",
                          borderRadius: "6px",
                          fontSize: "16px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--accent-secondary)";
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--accent-primary)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );
}