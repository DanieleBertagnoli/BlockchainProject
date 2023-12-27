function checkForm(formType)
{
    // Validate email
    var email = $('#email').val();
    if (!email) 
    {
        createErrorMsg('Please enter your email.');
        return false; // Prevent the form submission
    }

    // Validate passwords
    var password = $('#password').val();

    if(formType == 'signup')
    {
        var passwordConfirm = $('#password-confirm').val();
        var username = $('#username').val();
        var birthday = $('#birthday').val();

        if (!username) 
        {
            createErrorMsg('Please enter your username.');
            return false; // Prevent the form submission
        }

        if(!birthday)
        {
            createErrorMsg('Please enter your date of birth.');
            return false; // Prevent the form submission
        }

        var today = new Date();
        var birthDate = new Date(birthday);
        var age = today.getFullYear() - birthDate.getFullYear();

        if (age < 18) {
            createErrorMsg('You must be at least 18 years old.');
            return false; // Prevent the form submission
        }

        if (!password || !passwordConfirm) 
        {
            createErrorMsg('Please enter both password fields.');
            return false; // Prevent the form submission
        }

        if (password !== passwordConfirm) 
        {
            createErrorMsg('Passwords do not match.');
            return false; // Prevent the form submission
        }
    }
    else if(formType == 'login')
    {
        if (!password) 
        {
            createErrorMsg('Please enter your password.');
            return false; // Prevent the form submission
        }
    }
    else
    { return false; }
}

function createErrorMsg(errorMsg) 
{
    // Check if the error message element already exists
    var errorAlert = $('#error-alert');

    // If it doesn't exist, create it
    if (!errorAlert.length) 
    {
        var alertHtml = `
            <div id="error-alert" class="alert alert-danger alert-dismissible fade show" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                <span>${errorMsg}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Insert the error message element before the form
        $('.form').before(alertHtml);
    }  
    else // If it already exists, update the content
    { errorAlert.find('span').text(errorMsg); }
}

function checkMetamaskAddress(address) 
{
    // Use Web3 to check if the address is valid
    if (web3.utils.isAddress(address)) 
    { return true; } 
    else 
    { return false; }
}