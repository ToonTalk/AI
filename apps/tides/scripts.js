document.addEventListener('DOMContentLoaded', () => {
    // Gravity Animation
    const gravityCanvas = document.getElementById('gravityCanvas');
    const gravityCtx = gravityCanvas.getContext('2d');
    const earthX = gravityCanvas.width / 2;
    const earthY = gravityCanvas.height / 2;
    const earthRadius = 50;
    const moonRadius = 20;
    let moonAngle = 0;

    function drawEarth() {
        gravityCtx.beginPath();
        gravityCtx.arc(earthX, earthY, earthRadius, 0, 2 * Math.PI);
        gravityCtx.fillStyle = 'blue';
        gravityCtx.fill();
        gravityCtx.stroke();
    }

    function drawMoon() {
        const moonX = earthX + Math.cos(moonAngle) * 150;
        const moonY = earthY + Math.sin(moonAngle) * 150;
        gravityCtx.beginPath();
        gravityCtx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
        gravityCtx.fillStyle = 'grey';
        gravityCtx.fill();
        gravityCtx.stroke();

        // Draw gravitational pull lines
        gravityCtx.beginPath();
        gravityCtx.moveTo(earthX, earthY);
        gravityCtx.lineTo(moonX, moonY);
        gravityCtx.strokeStyle = 'yellow';
        gravityCtx.stroke();
    }

    function animateGravity() {
        gravityCtx.clearRect(0, 0, gravityCanvas.width, gravityCanvas.height);
        drawEarth();
        drawMoon();
        moonAngle += 0.01;
        requestAnimationFrame(animateGravity);
    }

    animateGravity();

    // Tides Animation
    const tidesCanvas = document.getElementById('tidesCanvas');
    const tidesCtx = tidesCanvas.getContext('2d');
    let tideAngle = 0;

    function drawTides() {
        tidesCtx.clearRect(0, 0, tidesCanvas.width, tidesCanvas.height);

        // Draw Earth
        tidesCtx.beginPath();
        tidesCtx.arc(earthX, earthY, earthRadius, 0, 2 * Math.PI);
        tidesCtx.fillStyle = 'blue';
        tidesCtx.fill();
        tidesCtx.stroke();

        // Draw the Moon
        const moonX = earthX + Math.cos(0) * 150; // Fixed position relative to Earth
        const moonY = earthY + Math.sin(0) * 150;
        tidesCtx.beginPath();
        tidesCtx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
        tidesCtx.fillStyle = 'grey';
        tidesCtx.fill();
        tidesCtx.stroke();

        // Draw water bulge representing high tide
        const bulgeHeight = 30; // Fixed height for simplicity
        const bulgeX1 = earthX + Math.cos(tideAngle) * (earthRadius + bulgeHeight);
        const bulgeY1 = earthY + Math.sin(tideAngle) * (earthRadius + bulgeHeight);
        const bulgeX2 = earthX - Math.cos(tideAngle) * (earthRadius + bulgeHeight);
        const bulgeY2 = earthY - Math.sin(tideAngle) * (earthRadius + bulgeHeight);
        
        tidesCtx.beginPath();
        tidesCtx.ellipse(earthX, earthY, earthRadius + bulgeHeight, earthRadius, tideAngle, 0, 2 * Math.PI);
        tidesCtx.strokeStyle = 'lightblue';
        tidesCtx.stroke();

        // Draw text labels
        tidesCtx.font = '16px Arial';
        tidesCtx.fillStyle = 'black';
        tidesCtx.fillText('High Tide', bulgeX1 + 10, bulgeY1);
        tidesCtx.fillText('Moon', moonX + moonRadius + 5, moonY);

        tideAngle += 0.02; // Speed of the tide animation
    }

    function animateTides() {
        drawTides();
        requestAnimationFrame(animateTides);
    }

    animateTides();

    // Sun and Tides Animation
    const sunTidesCanvas = document.getElementById('sunTidesCanvas');
    const sunTidesCtx = sunTidesCanvas.getContext('2d');
    const sunX = sunTidesCanvas.width / 2;
    const sunY = sunTidesCanvas.height / 2 - 200;
    const sunRadius = 40;
    let earthRotationAngle = 0;

    function drawSunTides() {
        sunTidesCtx.clearRect(0, 0, sunTidesCanvas.width, sunTidesCanvas.height);

        // Draw the Sun
        sunTidesCtx.beginPath();
        sunTidesCtx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI);
        sunTidesCtx.fillStyle = 'orange';
        sunTidesCtx.fill();
        sunTidesCtx.stroke();

        // Draw Earth
        const rotatedEarthX = sunTidesCanvas.width / 2;
        const rotatedEarthY = sunTidesCanvas.height / 2;
        sunTidesCtx.beginPath();
        sunTidesCtx.arc(rotatedEarthX, rotatedEarthY, earthRadius, 0, 2 * Math.PI);
        sunTidesCtx.fillStyle = 'blue';
        sunTidesCtx.fill();
        sunTidesCtx.stroke();

        // Draw the Moon (fixed relative to Earth)
        const moonX = rotatedEarthX + Math.cos(0) * 150; // Fixed position relative to Earth
        const moonY = rotatedEarthY + Math.sin(0) * 150;
        sunTidesCtx.beginPath();
        sunTidesCtx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
        sunTidesCtx.fillStyle = 'grey';
        sunTidesCtx.fill();
        sunTidesCtx.stroke();

        // Calculate combined tidal bulge effect from Moon and Sun
        const moonBulgeX = Math.cos(0) * 0.5; // Moon's influence on bulge (fixed)
        const moonBulgeY = Math.sin(0) * 0.5;
        const sunBulgeX = Math.cos(earthRotationAngle) * 0.5; // Sun's influence on bulge
        const sunBulgeY = Math.sin(earthRotationAngle) * 0.5;

        const totalBulgeX = earthRadius + 30 + (moonBulgeX + sunBulgeX) * 30;
        const totalBulgeY = earthRadius + (moonBulgeY + sunBulgeY) * 30;

        sunTidesCtx.beginPath();
        sunTidesCtx.ellipse(rotatedEarthX, rotatedEarthY, totalBulgeX, totalBulgeY, earthRotationAngle, 0, 2 * Math.PI);
        sunTidesCtx.strokeStyle = 'lightblue';
        sunTidesCtx.stroke();

        // Draw text labels
        sunTidesCtx.font = '16px Arial';
        sunTidesCtx.fillStyle = 'black';
        sunTidesCtx.fillText('High Tide', rotatedEarthX + totalBulgeX + 10, rotatedEarthY);
        sunTidesCtx.fillText('Moon', moonX + moonRadius + 5, moonY);
        sunTidesCtx.fillText('Sun', sunX + sunRadius + 5, sunY);

        earthRotationAngle += 0.02; // Speed of the Earth's rotation (faster for daily cycle)
    }

    function animateSunTides() {
        drawSunTides();
        requestAnimationFrame(animateSunTides);
    }

    animateSunTides();
});
