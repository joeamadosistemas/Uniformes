import React from 'react';
import { useT } from '../lib/LanguageContext';

export const GovFooter: React.FC = () => {
    const { t } = useT();
    return (
        <footer className="footer-container bg-[#071d41] text-white transition-colors duration-200 w-full mt-auto relative overflow-hidden">
            {/* Swiper simulated structure for the arrows and full-width background */}
            <div className="relative w-full">
                {/* Simulated Swiper Buttons */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-4 hidden md:block">
                    <i className="fas fa-chevron-left text-[#005A9C] text-4xl opacity-50 cursor-pointer hover:opacity-100 transition-opacity"></i>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-4 hidden md:block">
                    <i className="fas fa-chevron-right text-[#005A9C] text-4xl opacity-50 cursor-pointer hover:opacity-100 transition-opacity"></i>
                </div>

                <div className="max-w-screen-2xl mx-auto px-12 py-10">
                    <div className="flex flex-col md:flex-row justify-between gap-8 items-start">
                        <div className="flex-1">
                            <p className="font-bold mb-3">{t.footer.info}</p>
                            <p className="text-sm opacity-90">Rua João Rosa Gonzales, 1242 - Engenho, Itaguaí, Rio de Janeiro - Brasil</p>
                            <p className="text-sm opacity-90 mb-4">CEP: 23.820-380</p>
                            <hr className="border-t border-white/20 mb-4" />
                            <p className="text-sm opacity-90">{t.footer.tel}</p>
                            <p className="text-sm opacity-90">{t.footer.horario}</p>
                            <p className="text-sm opacity-90">E-mail: cpdinfra@edu.itaguai.rj.gov.br</p>
                            <p className="text-sm opacity-90">E-mail: infraestrutura@itaguai.rj.gov.br</p>
                        </div>

                        <div className="flex flex-col items-end text-right">
                            <div className="bg-white p-1 rounded mb-4">
                                <img
                                    className="h-10"
                                    src="https://novoportal.itaguai.rj.gov.br/++resource++gov.cidades/logo-cidades.jpeg"
                                    alt="Prefeitura de Itaguaí"
                                />
                            </div>
                            <p className="font-bold mb-2">{t.footer.redes}</p>
                            <hr className="w-full border-t border-white/20 mb-4" />
                            <div className="flex gap-4">
                                <a href="https://www.instagram.com/" target="_blank" className="text-2xl hover:text-[#66b3ff] transition-colors"><i className="fab fa-instagram"></i></a>
                                <a href="https://www.facebook.com/?ref=tn_tnmn" target="_blank" className="text-2xl hover:text-[#66b3ff] transition-colors"><i className="fab fa-facebook-f"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#05142b] py-4 text-center text-xs opacity-80 border-t border-white/5">
                {t.footer.desenvolvimento}
            </div>
        </footer>
    );
};
