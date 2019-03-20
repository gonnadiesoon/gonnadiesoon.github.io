function createCheckButton(text, color, lineLabel="") {
    let checkButton = document.createElement("label");
    checkButton.classList.add("checkbutton", "bordered");
    checkButton.innerHTML = 
    `<input type="checkbox" checked="checked" data-line-label="${lineLabel}">
    <span class="checkmark-container" style="
        background-color: ${color};
        border: 1px solid ${color};
    ">
        <div class="checkmark-container__background"></div>
        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29.756 29.756">
            <path d="M29.049 5.009l-.859-.858a2.434 2.434 0 0 0-3.434 0L10.172 18.737l-5.175-5.173a2.433 2.433 0 0 0-3.432.001l-.858.857a2.437 2.437 0 0 0 0 3.433l7.744 7.752a2.437 2.437 0 0 0 3.433 0L29.049 8.442a2.438 2.438 0 0 0 0-3.433z"
                fill="white" />
        </svg>
    </span>
    ${text}`

    return checkButton;
}