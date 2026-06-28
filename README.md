# Credit Card Comparison

This project is a work-in-progress calculator for comparing credit card rewards and finding an optimized multi-card wallet.

## Current Scope

At the moment, the application supports:

* Comparing annual rewards, fees, coupon values, and signup bonuses for individual cards
* Allocating spending categories across multiple cards to maximize estimated wallet value
* Reserving annual spending for signup bonus requirements when those offers improve first-year value
* Custom point valuations and user-defined values for card benefits and credits
* Saving and loading named spending presets as JSON files
* A curated catalog of Chase, United, BILT, Capital One, and American Express cards

Signup bonus requirements are modeled using annual spending. Shorter issuer deadlines, rotating-category limits, eligibility rules, and every merchant-coding exception are not currently enforced.

## Running the Application

### Build the Docker image

```bash
docker build -t credit-card-app .
```

### Run the container

```bash
docker run -p 3000:3000 credit-card-app
```

The application will then be available at:

```text
http://localhost:3000
```

## Status

This project is still under active development and card data, calculations, workflows, and features may change frequently.

## Disclaimer

This calculator provides estimates for informational purposes only. Results are not guaranteed to be accurate or complete and should not be relied upon as financial advice. Credit card rewards, fees, benefits, welcome offers, eligibility rules, and issuer terms can change. Confirm current terms directly with the card issuer before applying for a card or making financial decisions.

## License

This project is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE) for details.
