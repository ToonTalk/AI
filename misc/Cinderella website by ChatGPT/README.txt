Ella After Midnight (static multi-page site)

Files
- index.html / story.html / gallery.html / lost.html / about.html
- css/styles.css
- js/app.js
- assets/*.png (generated images integrated; you can replace/regen)

Run locally
- Open index.html in a browser.
- Or serve the folder to avoid any browser restrictions:
    python -m http.server 8000
  then visit http://localhost:8000

Replacing placeholders with AI-generated images
- Replace any assets/*.svg with .png/.jpg files and update the filenames:
  - In js/app.js, change the src fields under galleryItems.
  - In index.html photo strip and in other pages (look for assets/*.svg).