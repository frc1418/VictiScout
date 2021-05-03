function sleep(millis) {
    return new Promise((resolve, _) => setTimeout(resolve, millis));
}

module.exports = {
    sleep
}
