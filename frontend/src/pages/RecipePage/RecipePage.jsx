/** @module RecipePage.jsx */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./RecipePage.css";
import PizzaImageLoadingScreen from "../../PizzaLoader/PizzaImageLoadingScreen";
import { setRecipes } from "../../redux/actions/recipeActions";
import { Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import { updatePantryItems } from "../../redux/actions/productActions";

const RecipePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const pantryItems =
    useSelector((state) => state.productState?.products) ?? [];
  const recipes = useSelector((state) => state.recipeState?.recipes) ?? [];
  const user = useSelector((state) => state.userState?.loginResult);

  const structuredPantryItems = useMemo(() => {
    return pantryItems.map((item) => ({
      pantryID: item?.pantryid,
      productName: item?.productname,
      productCategory: item?.productcategory,
      quantity: item?.quantity,
      quantityType: item?.quantitytype ?? "units",
      expirationDate: item?.expiration_date,
      productUPC: item?.productupc
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

  const handleCookRecipe = async (recipe) => {
    if (!user || !user.token) {
      setSnackbar({
        open: true,
        message: "You must be logged in to cook a recipe",
        severity: "error"
      });
      return;
    }

    setCookingRecipe(recipe.name);
    try {
      const response = await fetch("http://localhost:5001/api/cook-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          recipe: recipe,
          pantryItems: structuredPantryItems
        }),
      });
      console.log("Recipe:", JSON.stringify(recipe, null, 2));
      console.log("PantryItems:", JSON.stringify(structuredPantryItems, null, 2));

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cook recipe");
      }

      if (data.success) {
        // Update the pantry items in Redux
        // We need to refetch the pantry items to get the updated list
        const pantryResponse = await fetch("http://localhost:5001/api/pantry", {
          headers: {
            "Authorization": `Bearer ${user.token}`
          }
        });
        
        const pantryData = await pantryResponse.json();
        
        if (pantryData.success) {
          dispatch(updatePantryItems(pantryData.pantry_items || []));
          
          // Create success message
          const successMessage = `Successfully cooked ${recipe.name}! Your pantry has been updated.`;
          
          // Store the snackbar message in sessionStorage to access it after redirect
          sessionStorage.setItem('pantrySnackbar', JSON.stringify({
            open: true,
            message: successMessage,
            severity: "success"
          }));
          
          // Redirect to the landing page (pantry)
          
          navigate("/pantry");
        }
      } else {
        throw new Error(data.error || "Failed to cook recipe");
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error"
      });
    } finally {
      setCookingRecipe(null);
    }
  };

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [fetchRecipes, recipes.length]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
                color: "var(--coffee-medium)", 
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: 800,
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
                    
                    <div className="recipe-actions">
                      <Button
                        onClick={() => handleCookRecipe(recipe)}
                        variant="contained"
                        color="primary"
                        disabled={cookingRecipe === recipe.name}
                        className="cook-button"
                        sx={{
                          mt: 0,
                          backgroundColor: "var(--coffee-medium)",
                          "&:hover": {
                            backgroundColor: "var(--coffee-dark)",
                          },
                          "&:disabled": {
                            backgroundColor: "var(--coffee-light)",
                          }
                        }}
                      >
                        {cookingRecipe === recipe.name ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Cook This Recipe"
                        )}
                      </Button>
                    </div>
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
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RecipePage;
