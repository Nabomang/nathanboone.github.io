// script.js - Blog functionality
document.addEventListener("DOMContentLoaded", function() {
  // Code block copy functionality
  document.querySelectorAll("div.sourceCode").forEach(function(codeDiv) {
    const pre = codeDiv.querySelector("pre");
    const code = pre ? pre.querySelector("code") : null;
    if (!pre || !code) return;

    pre.style.position = "relative";

    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "Copy";

    button.addEventListener("click", async function() {
      try {
        await navigator.clipboard.writeText(code.innerText);
        button.textContent = "Copied!";
        setTimeout(function() { button.textContent = "Copy"; }, 2000);
      } catch (err) {
        console.error("Copy failed", err);
        button.textContent = "Error";
      }
    });

    pre.appendChild(button);
  });

  // Recipe scaler functionality
  const scalerInput = document.getElementById("scaler-input");
  const scaleButton = document.getElementById("scale-recipe");
  const resetButton = document.getElementById("reset-recipe");
  const baseIngredientSelect = document.getElementById("base-ingredient-select");
  const ingredientUnit = document.getElementById("ingredient-unit");

  if (scalerInput && scaleButton && resetButton && baseIngredientSelect) {
    const originalAmounts = new Map();
    let baseIngredient = null;
    let baseAmount = 0;
    
    // Find ONLY the first task list (ingredients list) on the page
    const firstTaskList = document.querySelector("ul.task-list");
    const seenOptions = new Set();
    
  if (firstTaskList) {
    firstTaskList.querySelectorAll("li").forEach(function(li) {
      const label = li.querySelector("label");
      const checkbox = li.querySelector('input[type="checkbox"]');
      const text = (label ? label.textContent : li.textContent).trim().replace(/\s+/g, ' ');

      // Match patterns like: "200 g flour" or "120 ml water" or "5 salt"
      const match = text.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb|lbs)?\s+(.+)$/i);
      if (!match) return;

      const amount = parseFloat(match[1]);
      const unit = match[2] || "";
      const ingredient = match[3].trim();

      // ALWAYS store in originalAmounts (for scaling ALL items)
      originalAmounts.set(li, {
        amount: amount,
        unit: unit,
        ingredient: ingredient,
        originalText: text,
        hasCheckbox: !!checkbox,
        label: label
      });

      // Deduplicate by full text (amount + unit + ingredient)
      const key = text.toLowerCase().trim();
      if (seenOptions.has(key)) return;
      seenOptions.add(key);

      const option = document.createElement("option");
      option.value = ingredient;
      option.textContent = ingredient.substring(0, 30) + (ingredient.length > 30 ? "..." : "");
      option.dataset.amount = amount;
      option.dataset.unit = unit;
      option.dataset.ingredient = ingredient;
      baseIngredientSelect.appendChild(option);
    });
  }

    
    // When user selects an ingredient
    baseIngredientSelect.addEventListener("change", function() {
      const selected = this.options[this.selectedIndex];
      if (selected.value) {
        baseAmount = parseFloat(selected.dataset.amount);
        scalerInput.value = baseAmount;
        ingredientUnit.textContent = selected.dataset.unit;
        baseIngredient = selected.dataset.ingredient;
      }
    });
    
    scaleButton.addEventListener("click", function() {
      if (!baseIngredient) {
        alert("Please select an ingredient first");
        return;
      }
      
      const newBaseAmount = parseFloat(scalerInput.value);
      if (isNaN(newBaseAmount) || newBaseAmount <= 0) {
        alert("Please enter a valid amount");
        return;
      }
      
      const scaleFactor = newBaseAmount / baseAmount;
      
      originalAmounts.forEach(function(data, li) {
        const newAmount = Math.round(data.amount * scaleFactor * 10) / 10;
        const newText = newAmount + (data.unit ? " " + data.unit : "") + " " + data.ingredient;
        
        // Handle task list items with checkboxes differently
        if (data.hasCheckbox && data.label) {
          const checkbox = data.label.querySelector('input[type="checkbox"]');
          // Clear label text but keep checkbox
          while (data.label.childNodes.length > 1) {
            data.label.removeChild(data.label.lastChild);
          }
          // Add new text after checkbox
          data.label.appendChild(document.createTextNode(newText));
        } else {
          li.textContent = newText;
        }
      });
    });
    
    resetButton.addEventListener("click", function() {
      baseIngredientSelect.selectedIndex = 0;
      scalerInput.value = "";
      ingredientUnit.textContent = "g";
      baseIngredient = null;
      baseAmount = 0;
      
      originalAmounts.forEach(function(data, li) {
        if (data.hasCheckbox && data.label) {
          const checkbox = data.label.querySelector('input[type="checkbox"]');
          while (data.label.childNodes.length > 1) {
            data.label.removeChild(data.label.lastChild);
          }
          data.label.appendChild(document.createTextNode(data.originalText));
        } else {
          li.textContent = data.originalText;
        }
      });
    });
  }
});
