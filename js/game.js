let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    parent: 'gameDiv'
};

//Default values

let game = new Phaser.Game(config);
let stripLeft,
    stripCenter,
    stripRight,
    spinButton,
    balanceInput,
    fixedInput,
    icons,
    positions,
    currentBalance,
    shadow,
    prize,
    tweens;
let fixed = false; //Fixed Mode
let prevValues = [0, 0, 0];
let values = [0, 0, 0];
let iconHeight = 121; //Fixed Mode UI icons
let duration = [2000, 2500, 3000]; //Duration of each reel's spin
let spinning = false;
let balance = 10;
let balanceText = 0;

//Preload assets

function preload ()
{
    this.load.setBaseURL('.');

    this.load.image('strip', 'images/strip.png')
    this.load.image('slots', 'images/slots.png')
    this.load.image('fixed', 'images/fixed.png')
    this.load.image('white', 'images/white.png')
    this.load.spritesheet('spin', 'images/spin.png', {
        frameWidth: 114,
        frameHeight: 120
    })
}

//Setting up game content

function create ()
{
    //Visual elements

    let slotView = this.add.container(330, 170);
    let slotBG = this.add.tileSprite(0, 0, 450, 400, 'white');
    let slots = this.add.sprite(0, 0, 'slots');
    let fixedMode = this.add.container(0, 350);
    let fixedBG = this.add.tileSprite(400, 120, 800, 270, 'fixed');

    currentBalance = this.add.text(650, 20, 'Balance: ' + balance, { fontFamily: 'Cinzel' });
    stripLeft = this.add.tileSprite(-148, 0, 141, iconHeight * 3, 'strip');
    stripCenter = this.add.tileSprite(0, 0, 141, iconHeight * 3, 'strip');
    stripRight = this.add.tileSprite(148, 0, 141, iconHeight * 3, 'strip');
    prize = this.add.text(330, 280, '5', { fontFamily: 'Tienne', fontSize: 144, color: "rgb(255, 255, 63)" });
    prize.setOrigin(0.5);
    prize.setScale(0);

    spinButton = this.add.sprite(700, 200, 'spin');

    slotView.add([slotBG, stripLeft, stripCenter, stripRight, slots]);
    fixedMode.add([fixedBG]);
    
    //Spin button event listeners

    spinButton.setInteractive();
    spinButton.on('clicked', spin, this);
    spinButton.on('pointerover', () => { game.canvas.style.cursor = "pointer" } );
    spinButton.on('pointerout', () => { game.canvas.style.cursor = "default" } );

    //Syncing balance values on UI

    balanceInput = document.getElementById('balance-input');
    balanceInput.value = balance;

    balanceInput.oninput = () => {
        balance = parseInt(balanceInput.value);
        currentBalance.setText('Balance: ' + balanceText);
    }

    //Enabling/disabling Fixed Mode

    fixedInput = document.getElementById('fixed');
    fixedInput.checked = fixed;
    balanceInput.disabled = !fixed;

    fixedInput.oninput = () => {
        fixed = !fixed;
        balanceInput.disabled = !fixed;
    }

    //Determining whether the Spin button is interactive

    shadow = document.getElementById("shadow");
    this.input.on('gameobjectup', function (pointer, spinButton)
    {
        if (!spinning && balance > 0)
        {
            balance--;
            spinButton.setFrame(1);
            spinButton.emit('clicked', spinButton);
            spinning = true;
            shadow.style.visibility = "visible";
        }
    }, this);

    icons = document.getElementsByClassName("icons");
    positions = document.getElementsByClassName("position");
    tweens = this.tweens;
}

//Determine spin results

function spin ()
{
    //Behavior according to whether Fixed Mode is enabled

    if (!fixed)
    {
        values = [parseInt(Math.random() * 10), parseInt(Math.random() * 10), parseInt(Math.random() * 10)];
    }
    else
    {
        for (let j = 0; j < icons.length; j++)
        {
            let pos = icons[j].getElementsByTagName('input');
            for (let i = 0; i < pos.length; i++)
            {
                if (pos[i].checked)
                {
                    values[j] = parseInt(pos[i].value);
                    break;
                }
            }
        }
        for (let j = 0; j < positions.length; j++)
        {
            let pos = positions[j].getElementsByTagName('input');
            for (let i = 0; i < pos.length; i++)
            {
                if (pos[i].checked)
                {
                    switch(pos[i].value)
                    {
                        case "top":     values[j]++;
                                        break;
                        case "bottom":  values[j]--;
                                        if (values[j] < 0)
                                            values[j] += 10;
                                        break;
                    }
                    break;
                }
            }
        }
    }

    //Animate the reel

    let valueLeft = (prevValues[0] - values[0]) * iconHeight / 2;
    let valueCenter = (prevValues[1] - values[1]) * iconHeight / 2;
    let valueRight = (prevValues[2] - values[2]) * iconHeight / 2;

    tweens.add({
        targets: stripLeft,
        tilePositionY: {
            value: "-=" + (iconHeight * duration[0] / 100 + valueLeft),
            duration: duration[0],
            ease: 'Linear'
        }
    });
    tweens.add({
        targets: stripCenter,
        tilePositionY: {
            value: "-=" + (iconHeight * duration[1] / 100 + valueCenter),
            duration: duration[1],
            ease: 'Linear'
        }
    });
    tweens.add({
        targets: stripRight,
        tilePositionY: {
            value: "-=" + (iconHeight * duration[2] / 100 + valueRight),
            duration: duration[2],
            ease: 'Linear'
        },
        onComplete: stopSpin
    });
}

function showPrize(amount)
{
    prize.setText(amount);
    tweens.add({
        targets: prize,
        scaleX: { value: 1, duration: 200, ease: 'Power1' },
        scaleY: { value: 1, duration: 200, ease: 'Power1' },
        y: { value: "-=200", duration: 2000, ease: 'Power1' },
        alpha: { value: 0, duration: 1000, ease: 'Power1', delay: 1000 },
        onComplete: resetPrize
    });
}

function resetPrize ()
{
    prize.alpha = 1;
    prize.y += 200;
    prize.setScale(0, 0);
}

function stopSpin ()
{
    //Get the game ready for another spin

    spinning = false;
    spinButton.setFrame(0);
    shadow.style.visibility = "hidden";
    prevValues = values.slice(0, 3);
    console.log(values);

    //Reward the player accordingly

    if (values[0] == values[1] && values[0] == values [2])
    {
        switch (values[0])
        {
            case 9: balance += 50; //3 3xBARs on the center
                    showPrize(50);
                    break;
            case 8: balance += 50; //3 3xBARs at the bottom
                    showPrize(50);
                    break;
            case 7: balance += 2000; //3 cherries at the top
                    showPrize(2000);
                    break;
            case 6: balance += 1000; //3 cherries on the center
                    showPrize(1000);
                    break;
            case 5: balance += 4000; //3 cherries at the bottom
                    showPrize(4000);
                    break;
            case 4: balance += 150; //3 7s on the center
                    showPrize(150);
                    break;
            case 3: balance += 150; //3 7s at the bottom
                    showPrize(150);
                    break;
            case 2: balance += 20; //3 2xBARs on the center
                    showPrize(20);
                    break;
            case 1: balance += 20; //3 2xBARs at the bottom
                    showPrize(20);
                    break;
            case 0: balance += 10; //3 BARs on the center
                    showPrize(10);
                    break;
        }
    }
    else if (values[0] > 2 && values[0] < 8 && values[1] > 2 && values[1] < 8 && values[2] > 2 && values[2] < 8)
    {
        //Checking combination of cherries and 7s

        if (values[0] % 2 == 0 || values[1] % 2 == 0 || values[2] % 2 == 0)
        {
            if (values[0] % 2 == 0 && values[1] % 2 == 0 && values[2] % 2 == 0)
            {
                balance += 75;
                showPrize(75);
            }
        }
        else if (Math.abs(values[0] - values[1]) < 3 && Math.abs(values[0] - values[2]) < 3 && Math.abs(values[1] - values[2]) < 3)
        {
            balance += 75;
            showPrize(75);
        }
    }
    else if ((values[0] > 6 || values[0] < 4) && (values[1] > 6 || values[1] < 4) && (values[2] > 6 || values[2] < 4))
    {
        //Checking combination of BARs

        if (values[0] % 2 == 0 || values[1] % 2 == 0 || values[2] % 2 == 0)
        {
            if (values[0] % 2 == 0 && values[1] % 2 == 0 && values[2] % 2 == 0)
            {
                balance += 5;
                showPrize(5);
            }
        }
        else
        {
            for (let i = 0; i < values.length; i++)
            {
                if (values[i] > 6)
                {
                    values[i] -= 10;
                }
            }
            if (Math.abs(values[0] - values[1]) < 6 && Math.abs(values[0] - values[2]) < 6 && Math.abs(values[1] - values[2]) < 6)
            {
                balance += 5;
                showPrize(5);
            }
        }
    }
}

// Keep balance updated

function update ()
{
    balanceInput.value = balance;
    if (balanceText < balance)
        balanceText += parseInt((balance - balanceText) / 50) + 1;
    else if (balanceText > balance)
        balanceText--;
    currentBalance.setText('Balance: ' + balanceText);
}