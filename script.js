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

  const stepSpans = Array.from(dataEl.querySelectorAll('span'));
  const stepDefs = stepSpans.map(span => ({
    name: span.getAttribute('data-step-name'),
    minutes: parseInt(span.getAttribute('data-step-minutes'), 10),
    parallel: span.getAttribute('data-step-parallel') === 'true'
  }));

  if (!stepDefs.length) return;

  const planner = document.getElementById('bread-planner');
  if (!planner) return;
  const plannerCard = document.getElementById('planner-card');
  if (plannerCard) plannerCard.style.display = '';

  // Render editable step duration table before the date/time inputs
  const dateLabel = planner.querySelector('label[for="bread-ready-date"]');
  const editorDiv = document.createElement('div');
  editorDiv.className = 'bread-step-editor';
  let editorHtml = '<table><thead><tr><th>Step</th><th>Duration</th></tr></thead><tbody>';
  stepDefs.forEach((s, i) => {
    const rowClass = s.parallel ? ' class="step-parallel"' : '';
    const parallelLabel = s.parallel ? ' <span class="parallel-tag">&#8599; parallel</span>' : '';
    const useHours = s.minutes >= 60;
    const displayVal = useHours ? Math.round(s.minutes / 60 * 10) / 10 : s.minutes;
    const minSel = useHours ? '' : ' selected';
    const hSel = useHours ? ' selected' : '';
    editorHtml += `<tr${rowClass}><td>${s.name}${parallelLabel}</td>` +
      `<td><input type="number" class="step-duration-input" data-index="${i}" min="0.1" step="0.1" value="${displayVal}" />` +
      `<select class="step-unit-select" data-index="${i}"><option value="min"${minSel}>min</option><option value="h"${hSel}>h</option></select></td></tr>`;
  });
  editorHtml += '</tbody></table>';
  editorDiv.innerHTML = editorHtml;

  // Unit conversion when user switches between min and h
  editorDiv.addEventListener('change', function(e) {
    if (!e.target.classList.contains('step-unit-select')) return;
    const idx = e.target.getAttribute('data-index');
    const numInput = editorDiv.querySelector(`.step-duration-input[data-index="${idx}"]`);
    const currentVal = parseFloat(numInput.value) || 0;
    if (e.target.value === 'h') {
      numInput.value = Math.round(currentVal / 60 * 10) / 10;
      numInput.step = '0.1';
      numInput.min = '0.1';
    } else {
      numInput.value = Math.round(currentVal * 60);
      numInput.step = '1';
      numInput.min = '1';
    }
  });

  planner.insertBefore(editorDiv, dateLabel);

  // Helper: format a Date for display
  function fmt(d) {
    return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false });
  }
  function fmtDuration(m) {
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), rem = m % 60;
    return h + 'h' + (rem ? ' ' + rem + 'm' : '');
  }

  // Helper: format a Date as UTC iCal string YYYYMMDDTHHMMSSZ (RFC 5545 compliant, no VTIMEZONE needed)
  function formatIcalUtc(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}` +
           `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  }

  let lastSchedule = null;
  let lastReadyAt = null;

  document.getElementById('bread-calc').addEventListener('click', function () {
    const dateVal = document.getElementById('bread-ready-date').value;
    let timeVal = document.getElementById('bread-ready-time').value.trim();
    if (!dateVal || !timeVal) {
      document.getElementById('bread-schedule').innerHTML =
        '<p style="color:red;font-size:0.85rem;">Please fill in both a date and a time.</p>';
      return;
    }
    if (/^([01]\d|2[0-3])[0-5]\d$/.test(timeVal)) {
      timeVal = timeVal.slice(0, 2) + ':' + timeVal.slice(2);
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeVal)) {
      document.getElementById('bread-schedule').innerHTML =
        '<p style="color:red;font-size:0.85rem;">Time must be in 24h format HH:MM or HHMM (e.g. 18:00 or 1800).</p>';
      return;
    }

    // Read durations live from the editable inputs (with h/min unit conversion)
    const liveSteps = stepDefs.map((s, i) => {
      const input = editorDiv.querySelector(`.step-duration-input[data-index="${i}"]`);
      const unitSel = editorDiv.querySelector(`.step-unit-select[data-index="${i}"]`);
      const rawVal = input ? parseFloat(input.value) : NaN;
      const unit = unitSel ? unitSel.value : 'min';
      const mins = isNaN(rawVal) || rawVal <= 0
        ? s.minutes
        : (unit === 'h' ? Math.round(rawVal * 60) : Math.round(rawVal));
      return { name: s.name, minutes: mins, parallel: s.parallel };
    });

    const readyAt = new Date(dateVal + 'T' + timeVal);
    const schedule = [];
    let cursor = new Date(readyAt);

    // Build schedule backward; parallel steps share the cursor with the next sequential step
    for (let i = liveSteps.length - 1; i >= 0; i--) {
      const end = new Date(cursor);
      const start = new Date(cursor.getTime() - liveSteps[i].minutes * 60000);
      schedule.unshift({ name: liveSteps[i].name, minutes: liveSteps[i].minutes, start, end, parallel: liveSteps[i].parallel });
      if (!liveSteps[i].parallel) {
        cursor = start; // only advance cursor for sequential steps
      }
    }

    lastSchedule = schedule;
    lastReadyAt = readyAt;

    let html = '<table><thead><tr><th>Step</th><th>Start</th><th>Duration</th></tr></thead><tbody>';
    schedule.forEach(s => {
      const rowClass = s.parallel ? ' class="step-parallel"' : '';
      const parallelLabel = s.parallel ? ' <span class="parallel-tag">&#8599;</span>' : '';
      html += `<tr${rowClass}><td>${s.name}${parallelLabel}</td><td>${fmt(s.start)}</td>` +
              `<td class="step-duration">${fmtDuration(s.minutes)}</td></tr>`;
    });
    // Find the earliest sequential start for summary
    const firstSeq = schedule.find(s => !s.parallel);
    const summaryStart = firstSeq ? firstSeq.start : schedule[0].start;
    html += `</tbody></table><p style="margin-top:0.5rem;font-size:0.82rem;">` +
            `Start <strong>${fmt(summaryStart)}</strong> — ready by <strong>${fmt(readyAt)}</strong></p>`;

    document.getElementById('bread-schedule').innerHTML = html;

    // Show the .ics download button
    const icsBtn = document.getElementById('bread-download-ics');
    if (icsBtn) icsBtn.style.display = '';
  });

  // Now button — fills ready-by as now + total sequential step duration, then auto-calculates
  // Uses event delegation on planner so it works even inside a collapsed card on Android
  planner.addEventListener('click', function(e) {
    if (!e.target || e.target.id !== 'bread-now') return;
    // Sum live step durations from the editable table (sequential only for the total)
    let totalMins = 0;
    stepDefs.forEach((s, i) => {
      const input = editorDiv.querySelector(`.step-duration-input[data-index="${i}"]`);
      const unitSel = editorDiv.querySelector(`.step-unit-select[data-index="${i}"]`);
      const rawVal = input ? parseFloat(input.value) : NaN;
      const unit = unitSel ? unitSel.value : 'min';
      const mins = isNaN(rawVal) || rawVal <= 0
        ? s.minutes
        : (unit === 'h' ? Math.round(rawVal * 60) : Math.round(rawVal));
      if (!s.parallel) totalMins += mins;
    });
    const readyAt = new Date(Date.now() + totalMins * 60000);
    const yyyy = readyAt.getFullYear();
    const mo = String(readyAt.getMonth() + 1).padStart(2, '0');
    const dd = String(readyAt.getDate()).padStart(2, '0');
    const hh = String(readyAt.getHours()).padStart(2, '0');
    const mi = String(readyAt.getMinutes()).padStart(2, '0');
    document.getElementById('bread-ready-date').value = `${yyyy}-${mo}-${dd}`;
    document.getElementById('bread-ready-time').value = `${hh}:${mi}`;
    // Auto-trigger calculate
    const calcBtn = document.getElementById('bread-calc');
    if (calcBtn) calcBtn.click();
  });

  // .ics download + Google Calendar links for Android
  const icsBtn = document.getElementById('bread-download-ics');
  if (icsBtn) {
    icsBtn.addEventListener('click', function () {
      if (!lastSchedule || !lastReadyAt) return;

      const title = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : 'Recipe';
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const now = new Date();
      const stampStr = formatIcalUtc(now);

      let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Blog//Recipe Planner//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      lastSchedule.forEach((s, i) => {
        const startStr = formatIcalUtc(s.start);
        const endStr = formatIcalUtc(s.end);
        ics = ics.concat([
          'BEGIN:VEVENT',
          `UID:${now.getTime()}-${i}@blog`,
          `DTSTAMP:${stampStr}`,
          `DTSTART:${startStr}`,
          `DTEND:${endStr}`,
          `SUMMARY:${s.name}`,
          `DESCRIPTION:${title}`,
          'BEGIN:VALARM',
          'TRIGGER:-PT5M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Reminder',
          'END:VALARM',
          'END:VEVENT'
        ]);
      });

      ics.push('END:VCALENDAR');

      const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}-schedule.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show per-step Google Calendar links (reliable on Android)
      const scheduleDiv = document.getElementById('bread-schedule');
      if (scheduleDiv) {
        const existing = scheduleDiv.querySelector('.gcal-links');
        if (existing) existing.remove();
        const gcalDiv = document.createElement('div');
        gcalDiv.className = 'gcal-links';
        gcalDiv.innerHTML = '<p style="margin-top:0.75rem;font-size:0.82rem;">&#128279; Add to Google Calendar (Android):</p><ul style="margin:0.25rem 0 0 1rem;font-size:0.82rem;">' +
          lastSchedule.map(s => {
            const fmt8 = d => formatIcalUtc(d).replace('Z','');
            const dates = `${fmt8(s.start)}Z/${fmt8(s.end)}Z`;
            const gcUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
              `&text=${encodeURIComponent(s.name)}` +
              `&dates=${encodeURIComponent(dates)}` +
              `&details=${encodeURIComponent(title)}`;
            return `<li><a href="${gcUrl}" target="_blank" rel="noopener">${s.name}</a></li>`;
          }).join('') +
          '</ul>';
        scheduleDiv.appendChild(gcalDiv);
      }
    });
  }
}



function setupCollapsibleCards() {
  document.querySelectorAll('.recipe-card-header').forEach(function(header) {
    const card = header.closest('.recipe-card');
    if (!card) return;
    const body = card.querySelector('.recipe-card-body');
    if (!body) return;
    const cardId = card.id;
    const storageKey = cardId ? ('recipeCard_' + cardId) : null;

    // Restore saved state (default: closed)
    if (storageKey && localStorage.getItem(storageKey) === 'open') {
      body.classList.add('is-open');
      header.setAttribute('aria-expanded', 'true');
    }

    header.addEventListener('click', function() {
      const isOpen = body.classList.toggle('is-open');
      header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (storageKey) localStorage.setItem(storageKey, isOpen ? 'open' : 'closed');
    });
  });
}

// Initialize on DOM ready with multiple fallbacks
function initRecipeLayout() {
  log('Initializing recipe layout system');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRecipeLayout);
    document.addEventListener('DOMContentLoaded', setupBreadPlanner);
    document.addEventListener('DOMContentLoaded', setupCollapsibleCards);
    log('Waiting for DOMContentLoaded');
  } else {
    // DOM already loaded
    setupRecipeLayout();
    setupBreadPlanner();
    setupCollapsibleCards();
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
    const scalerDiv = document.querySelector(".recipe-scaler");
    const baseYield = scalerDiv ? parseFloat(scalerDiv.getAttribute("data-base-yield")) : NaN;
    const yieldUnit = scalerDiv ? (scalerDiv.getAttribute("data-yield-unit") || "") : "";
    const qtyDown = document.getElementById("qty-down");
    const qtyUp = document.getElementById("qty-up");
    const haveLabelEl = document.getElementById("scaler-have-label");

    const originalAmounts = new Map();
    let mode = null; // 'ingredient' | 'batch'
    let baseIngredient = null;
    let baseAmount = 0;

    // Collect all li items from all task-lists
    const allTaskLists = document.querySelectorAll("ul.task-list");
    const seenOptions = new Set();

    allTaskLists.forEach(function(taskList) {
      taskList.querySelectorAll("li").forEach(function(li) {
        const label = li.querySelector("label");
        const checkbox = li.querySelector('input[type="checkbox"]');
        const text = (label ? label.textContent : li.textContent).trim().replace(/\s+/g, ' ');
        const match = text.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb|lbs)?\s+(.+)$/i);
        if (!match) return;
        const amount = parseFloat(match[1]);
        const unit = match[2] || "";
        const ingredient = match[3].trim();
        originalAmounts.set(li, { amount, unit, ingredient, originalText: text, hasCheckbox: !!checkbox, label });
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
    });

    // Add batch option if yield data is present
    if (!isNaN(baseYield) && yieldUnit) {
      const group = document.createElement("optgroup");
      group.label = "Batch";
      const batchOpt = document.createElement("option");
      batchOpt.value = "__batch__";
      batchOpt.textContent = baseYield + " " + yieldUnit;
      group.appendChild(batchOpt);
      baseIngredientSelect.appendChild(group);
    }

    // Hide the scaler card entirely if nothing was parsed
    const hasOptions = originalAmounts.size > 0 || (!isNaN(baseYield) && yieldUnit);
    if (!hasOptions) {
      const scalerCard = document.getElementById("scaler-card");
      if (scalerCard) scalerCard.style.display = "none";
      return;
    }

    function showQtyButtons(show) {
      if (qtyDown) qtyDown.style.display = show ? "" : "none";
      if (qtyUp) qtyUp.style.display = show ? "" : "none";
    }

    if (qtyDown) {
      qtyDown.addEventListener("click", function() {
        scalerInput.value = Math.max(1, (parseFloat(scalerInput.value) || baseYield) - 1);
      });
    }
    if (qtyUp) {
      qtyUp.addEventListener("click", function() {
        scalerInput.value = (parseFloat(scalerInput.value) || baseYield) + 1;
      });
    }

    baseIngredientSelect.addEventListener("change", function() {
      const selected = this.options[this.selectedIndex];
      if (selected.value === "__batch__") {
        mode = 'batch';
        scalerInput.value = baseYield;
        ingredientUnit.textContent = yieldUnit;
        if (haveLabelEl) haveLabelEl.textContent = 'I want';
        showQtyButtons(true);
      } else if (selected.value) {
        mode = 'ingredient';
        baseAmount = parseFloat(selected.dataset.amount);
        scalerInput.value = baseAmount;
        ingredientUnit.textContent = selected.dataset.unit || "";
        baseIngredient = selected.dataset.ingredient;
        if (haveLabelEl) haveLabelEl.textContent = 'I have';
        showQtyButtons(false);
      } else {
        mode = null;
        scalerInput.value = "";
        ingredientUnit.textContent = "";
        if (haveLabelEl) haveLabelEl.textContent = 'I have';
        showQtyButtons(false);
      }
    });

    scaleButton.addEventListener("click", function() {
      if (mode === 'batch') {
        const newYield = parseFloat(scalerInput.value);
        if (isNaN(newYield) || newYield <= 0) { alert("Please enter a valid quantity"); return; }
        const factor = newYield / baseYield;
        originalAmounts.forEach(function(data, li) {
          const newAmount = Math.round(data.amount * factor * 10) / 10;
          const newText = newAmount + (data.unit ? " " + data.unit : "") + " " + data.ingredient;
          if (data.hasCheckbox && data.label) {
            while (data.label.childNodes.length > 1) data.label.removeChild(data.label.lastChild);
            data.label.appendChild(document.createTextNode(newText));
          } else {
            li.textContent = newText;
          }
        });
      } else if (mode === 'ingredient') {
        const newBaseAmount = parseFloat(scalerInput.value);
        if (isNaN(newBaseAmount) || newBaseAmount <= 0) { alert("Please enter a valid amount"); return; }
        const scaleFactor = newBaseAmount / baseAmount;
        originalAmounts.forEach(function(data, li) {
          const newAmount = Math.round(data.amount * scaleFactor * 10) / 10;
          const newText = newAmount + (data.unit ? " " + data.unit : "") + " " + data.ingredient;
          if (data.hasCheckbox && data.label) {
            while (data.label.childNodes.length > 1) data.label.removeChild(data.label.lastChild);
            data.label.appendChild(document.createTextNode(newText));
          } else {
            li.textContent = newText;
          }
        });
      } else {
        alert("Please select an ingredient or batch option first");
      }
    });

    resetButton.addEventListener("click", function() {
      baseIngredientSelect.selectedIndex = 0;
      scalerInput.value = "";
      ingredientUnit.textContent = "";
      baseIngredient = null;
      baseAmount = 0;
      mode = null;
      showQtyButtons(false);
      originalAmounts.forEach(function(data, li) {
        if (data.hasCheckbox && data.label) {
          while (data.label.childNodes.length > 1) data.label.removeChild(data.label.lastChild);
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

// ── Translation (unofficial Google Translate endpoint) ────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const article = document.querySelector('article');
  if (!article) return;

  const LANGS = [
    ['en', 'English'],
    ['nl', 'Nederlands'],
    ['ko', '한국어'],
    ['de', 'Deutsch'],
    ['fr', 'Français'],
    ['es', 'Español'],
    ['ja', '日本語'],
    ['zh-CN', '中文'],
  ];

  // Collect all translatable text nodes inside the article
  function getTextNodes() {
    const nodes = [];
    const skip = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'SAMP']);
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p || skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  // Translate a single string via unofficial endpoint
  async function translateText(text, lang) {
    const url = 'https://translate.googleapis.com/translate_a/single'
      + '?client=gtx&sl=auto&dt=t'
      + '&tl=' + encodeURIComponent(lang)
      + '&q=' + encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data[0].map(function (x) { return x[0]; }).join('');
  }

  let originalTexts = null;

  async function translatePage(lang) {
    const nodes = getTextNodes();
    if (!originalTexts) {
      originalTexts = nodes.map(function (n) { return n.textContent; });
    }
    const texts = nodes.map(function (n) { return n.textContent; });
    const BATCH = 5;
    for (let i = 0; i < nodes.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(function (t) {
        return translateText(t, lang);
      }));
      results.forEach(function (translated, j) {
        nodes[i + j].textContent = translated;
      });
    }
  }

  function revertPage() {
    if (!originalTexts) return;
    const nodes = getTextNodes();
    nodes.forEach(function (n, i) {
      if (originalTexts[i] !== undefined) n.textContent = originalTexts[i];
    });
    originalTexts = null;
  }

  // Build UI
  const wrapper = document.createElement('div');
  wrapper.id = 'translate-controls';

  const sel = document.createElement('select');
  sel.id = 'translate-lang';
  LANGS.forEach(function (pair) {
    const opt = document.createElement('option');
    opt.value = pair[0];
    opt.textContent = pair[1];
    sel.appendChild(opt);
  });

  const btn = document.createElement('button');
  btn.id = 'translate-btn';
  btn.textContent = '🌐 Translate';

  wrapper.appendChild(sel);
  wrapper.appendChild(btn);

  // Insert after date line (or after h1 if no date)
  const anchor = article.querySelector('.date') || article.querySelector('h1');
  if (anchor) anchor.insertAdjacentElement('afterend', wrapper);

  let translated = false;
  btn.addEventListener('click', async function () {
    if (translated) {
      revertPage();
      btn.textContent = '🌐 Translate';
      translated = false;
      return;
    }
    btn.disabled = true;
    btn.textContent = '⏳ Translating…';
    try {
      await translatePage(sel.value);
      btn.textContent = '↩ Revert';
      translated = true;
    } catch (err) {
      console.error('Translation failed:', err);
      btn.textContent = '🌐 Translate';
    }
    btn.disabled = false;
  });

  // Reset state when language is changed after translation
  sel.addEventListener('change', function () {
    if (translated) {
      revertPage();
      btn.textContent = '🌐 Translate';
      translated = false;
    }
  });
});

