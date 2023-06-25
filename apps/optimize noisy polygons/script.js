async function optimizeInput(model) {
    // Start with random input as a variable (assuming the input is normalized between 0 and 1)
    let input = tf.variable(tf.randomUniform([1, 12]));

    const learningRate = 0.01;  // Tune this as needed
    const optimizer = tf.train.adam(learningRate);

    for(let i = 0; i < 1000; i++){  // Maximum iterations - tune as needed
        let loss = optimizer.minimize(() => {
            let output = model.predict(input);
            // Since we want to maximize the output, we minimize the negative output
            return tf.neg(output);
        }, true /* return the loss, which is the negative of the output */);

        console.log('Iteration ' + i + ': rating ' + (-loss.dataSync()));

        if(i % 100 === 0){
            // Output the current input every 100 iterations
            console.log('Current input:', input.dataSync());
        }
    }

    return input.dataSync();
}

(async () => {
    const model = await tf.loadLayersModel('https://ecraft2learn.github.io/ai/noisy-polygons/rating%20predictor.json');
    model.summary();
    optimizeInput(model);
})();

