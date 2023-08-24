const { createWorker, createScheduler } = require('tesseract.js');



async function main() {
    const scheduler = createScheduler();
    const n = 3;
    let workers = [];
    for (let i = 0; i < n; i++) {
        workers[i] = await createWorker();
        await workers[i].loadLanguage('eng');
        await workers[i].initialize('eng');
        scheduler.addWorker(workers[i]);
    }
    /** Add 10 recognition jobs */
    const results = await Promise.all(Array(10).fill(0).map(() => (
        scheduler.addJob('recognize', 'https://tesseract.projectnaptha.com/img/eng_bw.png')
    )))
    console.log(results);
    await scheduler.terminate();
};

main();