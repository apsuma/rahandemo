function increment() {

    let angle = 0;
    let previewEvent = 0;

    document.getElementById('control').addEventListener("touchmove", (event) => {

        if (event.changedTouches[0].clientX > previewEvent) {

            if (document.getElementById('minutesChoice').value < 60) {
                document.getElementById('minutesChoice').value = parseInt(document.getElementById('minutesChoice').value) + 1;
                angle = angle + 4;
                document.getElementById('control').style.transform = 'rotate('+ angle +'deg)';
            }

        }
        if (event.changedTouches[0].clientX < previewEvent) {

            if (document.getElementById('minutesChoice').value > 0) { //0
                document.getElementById('minutesChoice').value = parseInt(document.getElementById('minutesChoice').value) - 1;
                angle = angle - 4;
                document.getElementById('control').style.transform = 'rotate('+ angle +'deg)';
                previewEvent = event.changedTouches[0].clientX;
            }
        }

        previewEvent = event.changedTouches[0].clientX;

    });
}


