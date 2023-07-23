async function optimizeInput(model) {
    // Start with random input as a variable (assuming the input is normalized between 0 and 1)
    let input = tf.variable(tf.randomUniform([1, 12]));

    const learningRate = 0.01;  // Tune this as needed
    const optimizer = tf.train.adam(learningRate);

    const target = 5;
    
    for(let i = 0; i < 1001; i++){  // Maximum iterations - tune as needed
        let loss = optimizer.minimize(() => {
            let output = model.predict(input);
            output = tf.squeeze(output);  // Reduce dimensions
            // We want to minimize the absolute difference between the output and the target
            return tf.abs(output.sub(target));
        }, true /* return the loss, which is the negative of the output */);

        // Apply the constraint (that inputs should be between 0 and 1)
        // And add a bit of noise
        // input.assign(tf.sigmoid(input).add(tf.randomUniform([1, 12], -0.01, 0.01)));


        if(i % 100 === 0){
            // Output the current input every 100 iterations
            console.log('Current input:', input.dataSync());
            console.log('Iteration ' + i + ': rating ' + (-loss.dataSync()));
        }
    }

    return input.dataSync();
}

(async () => {
    const model = await tf.loadLayersModel('https://ecraft2learn.github.io/ai/noisy-polygons/noisy polygons v2.json'); //rating%20predictor.json');
    model.summary();
    optimizeInput(model);
})();

