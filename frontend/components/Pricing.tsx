

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PricingProps {
  onStart: () => void;
}

const CheckIcon: React.FC = () => (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const XIcon: React.FC = () => (
    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);


const Pricing: React.FC<PricingProps> = ({ onStart }) => {
    const { t } = useLanguage();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="w-full max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {t('pricing_title')}
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
                {t('pricing_subtitle')}
            </p>

            <div className="mt-10 flex justify-center items-center space-x-4">
                <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>{t('plan_billing_monthly')}</span>
                <button
                    onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${billingCycle === 'monthly' ? 'bg-indigo-600' : 'bg-green-500'}`}
                    aria-label={t('plan_billing_cycle')}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${billingCycle === 'monthly' ? 'translate-x-1' : 'translate-x-6'}`} />
                </button>
                <span className={`font-semibold transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>{t('plan_billing_yearly')}</span>
                 <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
                    {t('plan_save_yearly')}
                </span>
            </div>


            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Free Plan */}
                <div className="bg-gray-800/50 p-8 rounded-lg border border-gray-700 h-full flex flex-col">
                    <h3 className="text-2xl font-bold">{t('plan_free_name')}</h3>
                    <p className="mt-4 text-4xl font-bold">
                        {t('plan_free_price')}
                    </p>
                    <p className="mt-2 text-sm text-gray-400">{t('plan_free_renewal')}</p>

                    <ul className="mt-8 space-y-4 text-left text-gray-300 flex-grow">
                        <li className="flex items-start space-x-3">
                            <CheckIcon />
                            <span>{t('plan_credits_free')}</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <CheckIcon />
                            <span>{t('plan_free_feature1')}</span>
                        </li>
                         <li className="flex items-start space-x-3">
                            <CheckIcon />
                            <span>{t('plan_free_feature2')}</span>
                        </li>
                        <li className="flex items-start space-x-3 text-gray-500">
                            <XIcon />
                            <span className="line-through">{t('plan_720p_disabled')}</span>
                        </li>
                        <li className="flex items-start space-x-3 text-gray-500">
                            <XIcon />
                            <span className="line-through">{t('plan_1080p_disabled')}</span>
                        </li>
                    </ul>

                    <button
                        onClick={onStart}
                        className="mt-8 w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-md transition-colors"
                    >
                        {t('plan_cta_start')}
                    </button>
                </div>

                {/* Premium Plan */}
                <div className="relative bg-indigo-900/30 p-8 rounded-lg border-2 border-indigo-500 h-full flex flex-col">
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                        <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">{t('plan_popular')}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-indigo-300">{t('plan_premium_name')}</h3>
                     <p className="mt-4 text-4xl font-bold">
                        {billingCycle === 'monthly' ? t('plan_premium_price_monthly') : t('plan_premium_price_yearly')}
                        <span className="text-lg font-normal text-gray-400">
                           {billingCycle === 'monthly' ? t('plan_per_month') : t('plan_per_year')}
                        </span>
                    </p>
                    <p className="mt-2 text-sm text-gray-400">{t('plan_premium_renewal')}</p>

                    <ul className="mt-8 space-y-4 text-left text-gray-300 flex-grow">
                        <li className="flex items-start space-x-3">
                            <CheckIcon />
                            <span>{t('plan_credits_premium')}</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <CheckIcon />
                            <span>{t('plan_premium_feature1')}</span>
                        </li>
                         <li className="flex items-start space-x-3">
                            <CheckIcon />
                            <span>{t('plan_premium_feature2')}</span>
                        </li>
                         <li className="flex items-start space-x-3">
                            <CheckIcon />
                            <span>{t('plan_premium_feature3')}</span>
                        </li>
                    </ul>
                    
                     <button
                        onClick={onStart}
                        className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-md transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        {t('plan_cta_upgrade')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;