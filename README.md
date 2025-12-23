# Nexty-Directory Customization Guide

nexty-directory is developed based on the [Nexty Template](https://nexty.dev/) and is available to all Nexty paid users.

- Live Site: https://dofollow.tools/
- Source Code: https://github.com/WeNextDev/nexty-directory

This guide is designed to help you quickly customize the `Nexty-Directory` template, so you can easily adapt it into your own directory website.

## 1. Modify Basic Website Information

The core information for the website, such as its name, tagline, description, and social media links, is centralized in the `config/site.ts` file. Please modify this file to suit your specific needs.

## 2. Payments

This project does not include built-in checkout or subscription billing. If you want to sell premium listings or outreach services, handle payments manually (e.g. PayPal/USDT) and direct users to the `/services` page.

## 3. Modify Email Templates

The system automatically sends emails when a user registers or subscribes to the newsletter. These email templates are located in the `emails/` directory.

- `emails/user-welcome.tsx`: Welcome email for new users.
- `emails/newsletter-welcome.tsx`: Welcome email for new newsletter subscribers.
- `emails/product-approved.tsx`: Notification email for submitted product that has been featured.
- `emails/magic-link-email.tsx`: Magic link sign-in email.

## 4. Replace the Badge

The `public/badge` folder contains the badge for the directory site. This allows your users to promote your site. You can create a new badge [here](https://findly.tools/badge-generator).

## 5. Replace the DR (Domain Rating) Badge

The `components/shared/FrogDR.tsx` component has a hardcoded `ahrefs` DR badge. You should replace this with your own domain rating badge. If you do not need to display this information, you can remove the component entirely. You can create your own DR badge [here](https://frogdr.com/).
