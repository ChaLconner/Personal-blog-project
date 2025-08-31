(async () => {
  try {
    const res = await fetch('http://localhost:3001/blog/posts?limit=1&offset=0');
    console.log('STATUS', res.status);
    const t = await res.text();
    console.log('BODY', t.slice(0,1000));
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
