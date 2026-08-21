import { createApp } from 'vue';
import QualitySelectModal from '@/components/QualitySelectModal.vue';

export default {
    install() {
        let instance = null;

        const mount = () => {
            if (!instance) {
                const app = createApp(QualitySelectModal);
                const div = document.createElement('div');
                document.body.appendChild(div);
                instance = app.mount(div);
            }
        };

        const open = (options) => {
            mount();
            return instance.open(options);
        };

        window.$qualityModal = { open };
    },
};
