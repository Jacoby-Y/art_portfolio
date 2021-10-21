var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/Jacoby-Y/art_portfolio.git', // Update to point to your repository  
        user: {
            name: 'Jacoby-Y', // update to use your name
            email: 'cobyyliniemi@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)