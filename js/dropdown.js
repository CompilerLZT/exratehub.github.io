document.addEventListener('DOMContentLoaded', function () {
    const currencyBlocks = document.querySelectorAll('.setting__currency-block');

    currencyBlocks.forEach(function (block, index) {
        const tokenBlock = block.querySelector('.token__block');
        const tokenInp = block.querySelector('.token__inp');
        const currencyVisionBox = block.querySelector('.setting__currency-vision-box');
        const currencyValutName = currencyVisionBox?.querySelector('.setting__currency-valut-name');
        const currencyValutSubName = currencyVisionBox?.querySelector('.setting__currency-valut-sub-name');
        const currencyValutImg = currencyVisionBox?.querySelector('.korm');

        if (!tokenBlock || !tokenInp || !currencyVisionBox) {
            console.warn(`Missing elements in Block ${index + 1}`);
            return;
        }

        tokenBlock.addEventListener('click', function (e) {
            const target = e.target.closest('.token__line');
            if (!target) return;

            const activeToken = tokenBlock.querySelector('.token__line.active-border');
            activeToken?.classList.remove('active-border');

            target.classList.add('active-border');
            const selectedToken = target.getAttribute('data-token');
            const selectedNetwork = target.getAttribute('data-network');
            if (!selectedToken) {
                console.warn(`Token without data-token in Block ${index + 1}`);
                return;
            }
            const amountCurrency = document.querySelector('.sear')
            amountCurrency.innerHTML = selectedToken;
            const tokenImg = target.querySelector('.token__img img')?.src;
            const tokenName = target.querySelector('.token__line-ttl')?.textContent;
            const tokenSubName = target.querySelector('.token__line-txt')?.textContent;

            if (currencyValutName) currencyValutName.textContent = tokenName || '';
            if (currencyValutSubName) currencyValutSubName.textContent = tokenSubName || '';
            if (currencyValutImg) currencyValutImg.src = tokenImg || '';
        });

        tokenInp.addEventListener('input', function () {
            const filter = tokenInp.value.toLowerCase();
            const tokenLines = tokenBlock.querySelectorAll('.token__line');

            tokenLines.forEach(function (line) {
                const tokenName = line.querySelector('.token__line-ttl')?.textContent.toLowerCase() || '';
                const tokenSubName = line.querySelector('.token__line-txt')?.textContent.toLowerCase() || '';

                if (tokenName.includes(filter) || tokenSubName.includes(filter)) {
                    line.style.display = '';
                } else {
                    line.style.display = 'none';
                }
            });
        });
    });
});
