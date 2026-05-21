// script.js - Blog functionality
// ============================================
// Recipe Layout System
// ============================================

// Debug logging - set to false in production
const RECIPE_DEBUG = true;

function log(...args) {
  if (RECIPE_DEBUG) {
    console.log('[Recipe Layout]', ...args);
  }
}

/**
 * Main recipe layout setup
 * Runs on page load for recipe pages
 */
function setupRecipeLayout() {
  log('Starting recipe layout setup...');
  
  try {
    // 1. Check if this is a recipe page
    if (!document.body.classList.contains('is-recipe')) {
      log('Not a recipe page, skipping');
      return;
    }
    
    // 2. Find the hidden data element with image info
    const imageData = document.getElementById('recipe-image-data');
    if (!imageData) {
      log('No recipe image data found, skipping');
      return;
    }
    
    const imageSrc = imageData.getAttribute('data-image-src');
    const imageAlt = imageData.getAttribute('data-image-alt');
    
    if (!imageSrc) {
      log('No image source in data element, skipping');
      return;
    }
    
    log('Found image data:', { src: imageSrc, alt: imageAlt });
    
    // 3. Find the ingredients heading
    const ingredientsHeading = document.getElementById('ingredients');
    if (!ingredientsHeading) {
      log('No ingredients heading found, skipping');
      return;
    }
    
    log('Found ingredients heading');
    
    // 4. Create the recipe image element
    const recipeImage = document.createElement('div');
    recipeImage.className = 'recipe-main-image';
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = imageAlt || 'Recipe image';
    
    recipeImage.appendChild(img);
    log('Created recipe image element');
    
    // 5. Create the grid layout on desktop
    if (window.innerWidth >= 769) {
      log('Desktop layout: Creating grid');
      createDesktopLayout(ingredientsHeading, recipeImage);
    } else {
      log('Mobile layout: Inserting image at top');
      createMobileLayout(recipeImage);
    }
    
    log('Recipe layout setup complete');
    
  } catch (error) {
    console.error('[Recipe Layout] Error:', error);
  }
}

/**
 * Desktop: Create grid with image beside ingredients
 */
function createDesktopLayout(ingredientsHeading, recipeImage) {
  // Find where ingredients section ends (next h3 or h2)
  let currentElement = ingredientsHeading;
  const gridContent = [ingredientsHeading];

  // Save parent and insertion point BEFORE moving any elements out of the DOM
  const articleParent = ingredientsHeading.parentNode;

  // Collect all elements that are part of the ingredients section
  while (currentElement.nextElementSibling) {
    currentElement = currentElement.nextElementSibling;
    
    // Stop if we hit another heading
    if (currentElement.tagName === 'H2' || currentElement.tagName === 'H3') {
      break;
    }
    
    gridContent.push(currentElement);
  }

  // The element after the last ingredient item — grid goes right before it
  const insertionRef = gridContent[gridContent.length - 1].nextSibling;
  
  log('Found', gridContent.length, 'elements in ingredients section');
  
  // Create grid container
  const grid = document.createElement('div');
  grid.className = 'recipe-layout-grid';
  
  // Create left column (ingredients)
  const leftColumn = document.createElement('div');
  leftColumn.className = 'recipe-ingredients-column';
  
  // Move ingredients content into left column
  gridContent.forEach(el => leftColumn.appendChild(el));
  
  // Add columns to grid
  grid.appendChild(leftColumn);
  grid.appendChild(recipeImage);
  
  // Insert grid into article at the correct position
  articleParent.insertBefore(grid, insertionRef);
  
  log('Desktop grid created successfully');
}

/**
 * Mobile: Insert image at top of article
 */
function createMobileLayout(recipeImage) {
  const article = document.querySelector('article');
  if (!article) {
    log('Warning: No article element found');
    return;
  }
  
  // Find the scaler (insert after it)
  const scaler = document.querySelector('.recipe-scaler');
  if (scaler && scaler.nextSibling) {
    scaler.parentNode.insertBefore(recipeImage, scaler.nextSibling);
    log('Inserted image after scaler');
  } else {
    // Fallback: insert at beginning of article
    article.insertBefore(recipeImage, article.firstChild);
    log('Inserted image at top of article');
  }
}

/**
 * Handle window resize - switch between layouts
 */
function handleRecipeResize() {
  if (!document.body.classList.contains('is-recipe')) return;
  
  log('Window resized, checking if layout needs to change');
  
  // For now, just log - full implementation would rebuild layout
  // This is acceptable for MVP since users rarely resize mid-session
}

// Initialize on DOM ready with multiple fallbacks
function setupBreadPlanner() {
  const dataEl = document.getElementById('bread-timing-data');
  if (!dataEl) return;
  if (dataEl.getAttribute('data-recipe-type') !== 'bread') return;

  const steps = Array.from(dataEl.querySelectorAll('span')).map(span => ({
    name: span.getAttribute('data-step-name'),
    minutes: parseInt(span.getAttribute('data-step-minutes'), 10)
  }));

  if (!steps.length) return;

  const planner = document.getElementById('bread-planner');
  if (!planner) return;
  planner.style.display = '';

  document.getElementById('bread-calc').addEventListener('click', function () {
    const dateVal = document.getElementById('bread-ready-date').value;
    const timeVal = document.getElementById('bread-ready-time').value;
    if (!dateVal || !timeVal) {
      document.getElementById('bread-schedule').innerHTML =
        '<p style="color:red;font-size:0.85rem;">Please fill in both a date and a time (HH:MM).</p>';
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeVal)) {
      document.getElementById('bread-schedule').innerHTML =
        '<p style="color:red;font-size:0.85rem;">Time must be in 24h format HH:MM (e.g. 18:00).</p>';
      return;
    }

    const readyAt = new Date(dateVal + 'T' + timeVal);
    const schedule = [];
    let cursor = new Date(readyAt);

    for (let i = steps.length - 1; i >= 0; i--) {
      const end = new Date(cursor);
      cursor = new Date(cursor.getTime() - steps[i].minutes * 60000);
      schedule.unshift({ name: steps[i].name, minutes: steps[i].minutes, start: new Date(cursor), end });
    }

    function fmt(d) {
      return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false });
    }
    function fmtDuration(m) {
      if (m < 60) return m + ' min';
      const h = Math.floor(m / 60), rem = m % 60;
      return h + 'h' + (rem ? ' ' + rem + 'm' : '');
    }

    let html = '<table><thead><tr><th>Step</th><th>Start</th><th>Duration</th></tr></thead><tbody>';
    schedule.forEach(s => {
      html += `<tr><td>${s.name}</td><td>${fmt(s.start)}</td>` +
              `<td class="step-duration">${fmtDuration(s.minutes)}</td></tr>`;
    });
    html += `</tbody></table><p style="margin-top:0.5rem;font-size:0.82rem;">` +
            `Start <strong>${fmt(schedule[0].start)}</strong> — ready by <strong>${fmt(readyAt)}</strong></p>`;

    document.getElementById('bread-schedule').innerHTML = html;
  });
}

// Initialize on DOM ready with multiple fallbacks
function initRecipeLayout() {
  log('Initializing recipe layout system');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRecipeLayout);
    document.addEventListener('DOMContentLoaded', setupBreadPlanner);
    log('Waiting for DOMContentLoaded');
  } else {
    // DOM already loaded
    setupRecipeLayout();
    setupBreadPlanner();
    log('DOM already loaded, running immediately');
  }
}

// Start initialization immediately
initRecipeLayout();

// Listen for resize (debounced)
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(handleRecipeResize, 250);
});


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

// Gallery lightbox functionality
document.addEventListener('DOMContentLoaded', function() {
  const galleryImages = document.querySelectorAll('.gallery img');
  
  if (galleryImages.length === 0) return;
  
  // Create lightbox element
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <span class="lightbox-close">&times;</span>
    <img src="" alt="">
  `;
  document.body.appendChild(lightbox);
  
  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  
  // Open lightbox on image click
  galleryImages.forEach(img => {
    img.addEventListener('click', function(e) {
      e.preventDefault();
      lightboxImg.src = this.src;
      lightboxImg.alt = this.alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
  
  // Close lightbox
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Close on X button
  closeBtn.addEventListener('click', closeLightbox);
  
  // Close on background click
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  
  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
});

// Make sure this runs AFTER recipe layout
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure recipe layout finished
  setTimeout(() => {
    const postImages = document.querySelectorAll('article img');

    postImages.forEach(img => {
      if (!img.closest('.gallery') && !img.closest('a')) {
        const link = document.createElement('a');
        link.href = img.src;
        link.setAttribute('data-fslightbox', 'post-images'); 
        link.setAttribute('data-title', img.alt || ' ');

        img.parentNode.replaceChild(link, img);
        link.appendChild(img);
      }
    });
  }, 100); // 100ms delay
});


document.addEventListener('DOMContentLoaded', () => {
  // Find all images within the main article content
  const postImages = document.querySelectorAll('article img');

  postImages.forEach(img => {
    // Check if the image is NOT inside a gallery (to avoid applying two lightboxes)
    // and also check it's not already wrapped in a link.
    if (!img.closest('.gallery') && !img.closest('a')) {
      
      const link = document.createElement('a');
      link.href = img.src; // The link will point to the full-size image

      // Add the same attributes that your gallery script looks for
      link.setAttribute('data-fslightbox', 'post-images'); 
      link.setAttribute('data-title', img.alt || ' '); // Use the image's alt text as a caption

      // Wrap the image with the newly created link
      img.parentNode.replaceChild(link, img);
      link.appendChild(img);
    }
  });
});

