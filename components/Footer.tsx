import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedinIn, faInstagram, faFacebookF } from '@fortawesome/free-brands-svg-icons';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-fuchsia-200 text-slate-700 py-10 mt-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                {/* Footer Message */}
                <div className="mb-6">
                    <h1 className="text-lg font-semibold mb-3">
                        You made it to the end — nice! 
                        <a href="#top" className="text-fuchsia-600 hover:text-fuchsia-800 transition-colors underline ml-1">
                            Click my name to zoom back up.
                        </a> 
                        Got something on your mind? Feel free to connect with me!
                    </h1>
                </div>

                {/* Footer Actions (Contact Me Button) */}
                <div className="mb-6">
                    <a 
                        href="mailto:reddumalagan@gmail.com" 
                        className="inline-block px-6 py-2 border border-fuchsia-600 text-fuchsia-600 font-semibold rounded-lg hover:bg-fuchsia-600 hover:text-white transition-colors shadow-md"
                    >
                        Contact Me
                    </a>
                </div>
                
                {/* Social Links */}
                <div className="social-links text-3xl mb-4 space-x-6 text-fuchsia-600">
                    <a href="https://github.com/Redd711" target="_blank" rel="noopener noreferrer" aria-label="GitHub Profile" className="hover:text-fuchsia-800 transition-colors">
                        <FontAwesomeIcon icon={faGithub} />
                    </a>
                    <a href="https://www.linkedin.com/in/johnred-dumalagan-bb2092326/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile" className="hover:text-fuchsia-800 transition-colors">
                        <FontAwesomeIcon icon={faLinkedinIn} />
                    </a>
                    <a href="https://www.instagram.com/redct.d/?hl=en" target="_blank" rel="noopener noreferrer" aria-label="Instagram Profile" className="hover:text-fuchsia-800 transition-colors">
                        <FontAwesomeIcon icon={faInstagram} />
                    </a>
                    <a href="https://www.facebook.com/reddumalagan/" target="_blank" rel="noopener noreferrer" aria-label="Facebook Profile" className="hover:text-fuchsia-800 transition-colors">
                        <FontAwesomeIcon icon={faFacebookF} />
                    </a>
                </div>
                <p className="text-sm text-slate-500">&copy; 2025 Red. All rights reserved.</p>
            </div>
        </footer>
    );
};