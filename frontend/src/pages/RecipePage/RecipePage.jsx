/** @module RecipePage.jsx */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./RecipePage.css";
import PizzaImageLoadingScreen from "../../PizzaLoader/PizzaImageLoadingScreen";
import { setRecipes } from "../../redux/actions/recipeActions";
import { Button } from "@mui/material";

const RecipePage = () => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pantryItems =
    useSelector((state) => state.productState?.products) ?? [];
  const recipes = useSelector((state) => state.recipeState?.recipes) ?? [];

  const structuredPantryItems = useMemo(() => {
    return pantryItems.map((item) => ({
      productName: item?.productname,
      productCategory: item?.productcategory,
      quantity: item?.quantity,
      quantityType: item?.quantitytype ?? "units",
      expirationDate: item?.expiration_date,
    }));
  }, [pantryItems]);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5001/api/get-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pantryItems: structuredPantryItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch recipes");
      }

      const data = await response.json();

      if (data.success) {
        // Parse the recipes from the response
        const parsedRecipes =
          typeof data.recipes === "string"
            ? JSON.parse(data.recipes)
            : data.recipes;
        dispatch(setRecipes(parsedRecipes || []));
      } else {
        throw new Error(data.error || "Failed to get recipes");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, structuredPantryItems]);

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [fetchRecipes, recipes.length]);

  return (
    <div className="container recipe-page">
      <div className="recipe-header">
        <h1>Recipe Recommendations</h1>
        <p className="recipe-subheader">
          Based on your pantry items, here are some recipe suggestions:
        </p>
        <hr className="divider" />
        <div className="suggestion-primer">
          Want New Suggestions?{" "}
          {!isLoading && (
            <Button
              onClick={fetchRecipes}
              variant="text"
              sx={{
                color: "#3498db",
                cursor: "pointer",
                fontSize: "16px",
                "&:hover": {
                  color: "#fff",
                },
              }}
            >
              Regenerate Recipes
            </Button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <PizzaImageLoadingScreen />
      ) : (
        <>
          {recipes.length > 0 ? (
            <div className="recipe-grid">
              {recipes.map((recipe, index) => (
                <div className="recipe-card" key={index}>
                  <div className="recipe-card-header">
                    <h3>{recipe.name}</h3>
                    <div className="recipe-meta">
                      <span className="recipe-time">{recipe.cookingTime}</span>
                      <span className="recipe-type">{recipe.mealType}</span>
                    </div>
                  </div>
                  <div className="recipe-card-body">
                    <p className="recipe-description">{recipe.description}</p>

                    <h4>Ingredients:</h4>
                    <ul className="ingredients-list">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i}>{ingredient}</li>
                      ))}
                    </ul>

                    <h4>Instructions:</h4>
                    <ol className="instructions-list">
                      {recipe.instructions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No recipes found. Try adding more items to your pantry!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecipePage;
