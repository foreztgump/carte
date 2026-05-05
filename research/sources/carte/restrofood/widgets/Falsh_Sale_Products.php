<?php
namespace RestroFood\widgets;
/**
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */
use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Scheme_Color;
use Elementor\Scheme_Typography;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Border;

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 *
 * Elementor Falsh_Sale_Products widget.
 *
 * @since 1.0
 */

class Falsh_Sale_Products extends Widget_Base {
    
	public function get_name() {
		return 'restrofood-falsh-sale-products';
	}

	public function get_title() {
		return esc_html__( 'Falsh Sale Products', 'restrofood' );
	}

	public function get_icon() {
		return 'eicon-text';
	}

	public function get_categories() {
		return ['restrofood-elements-category'];
	}

	protected function register_controls() {

		$repeater = new \Elementor\Repeater();

        // ---------------------------------------- Content ------------------------------
        $this->start_controls_section(
            'restrofood_falsh_sale_product_settings',
            [
                'label' => esc_html__( 'Falsh Sale Product Content', 'restrofood' ),
            ]
        );

        $this->add_control(
            'limit',
            [
                'label' => esc_html__( 'Limit', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'label_block' => true,
                'default' => 10
            ]
        );
        $this->add_control(
            'items_per_slide',
            [
                'label' => esc_html__( 'Items Per Slide', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'label_block' => true,
                'default' => 4
            ]
        );
        $this->add_control(
            'title',
            [
                'label' => esc_html__( 'Top Title', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::TEXT,
                'label_block' => true,
                'default' => esc_html__( 'Flash Sale', 'restrofood' ),
            ]
        );
        $this->add_control(
            'show_vab',
            [
                'label' => esc_html__( 'Show View All Button', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__( 'Show', 'restrofood' ),
                'label_off' => esc_html__( 'Hide', 'restrofood' ),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );
        $this->add_control(
            'btn_link',
            [
                'label' => esc_html__( 'Button Link', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => esc_html__( 'https://your-link.com', 'restrofood' ),
                'condition' => [ 'show_vab' => 'yes' ],
                'default' => [
                    'url' => '',
                    'is_external' => true,
                    'nofollow' => true,
                    'custom_attributes' => '',
                ],
            ]
        );

        $this->end_controls_section(); // End content

       
        /**
         * Style Tab
         * ------------------------------ Content Style ------------------------------
         *
         */
        $this->start_controls_section(
            'restrofood_flash_sale_wrapper_style_settings', [
                'label' => esc_html__( 'Content Wrapper Style Settings', 'restrofood' ),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        $this->add_control(
            'section_padding',
            [
                'label' => esc_html__( 'Padding', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .rb__wrapper' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'separator' => 'after'
            ]
        );
        $this->add_control(
            'section_margin',
            [
                'label' => esc_html__( 'Margin', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .rb__wrapper' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        $this->add_control(
            'title_color',
            [
                'label' => esc_html__( 'Title Color', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .flashsale-slider-title h3' => 'color: {{VALUE}}',
                ],
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'label' => esc_html__( 'Typography', 'restrofood' ),
                'selector' => '{{WRAPPER}} .flashsale-slider-title h3',
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Background::get_type(),
            [
                'name' => 'flash_sale_background',
                'label' => esc_html__( 'Background', 'restrofood' ),
                'types' => [ 'classic', 'gradient' ],
                'selector' => '{{WRAPPER}} .rb__wrapper',
            ]
        );
        $this->end_controls_section();

        /**
         * Style Tab
         * ------------------------------ Button Settings ------------------------------
         *
         */
        $this->start_controls_section(
            'btn_settings', [
                'label' => esc_html__( 'Button Style', 'restrofood' ),
                'tab' => Controls_Manager::TAB_STYLE
            ]
        );

        //  Controls tab start
        $this->start_controls_tabs( 'btn_tabs_start' );

        //  Controls tab For Normal
        $this->start_controls_tab(
            'btn_normal',
            [
                'label' => esc_html__( 'Normal', 'restrofood' ),
            ]
        );
        $this->add_responsive_control(
            'btn_padding',
            [
                'label' => esc_html__( 'Padding', 'restrofood' ),
                'type' => Controls_Manager::DIMENSIONS,
                'devices' => [ 'desktop', 'tablet', 'mobile' ],
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .flashsale-slider-top a' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        $this->add_control(
            'btn_color',
            [
                'label' => esc_html__( 'Text Color', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .flashsale-slider-top a' => 'color: {{VALUE}}',
                ],
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'btn_border',
                'label' => esc_html__( 'Border', 'restrofood' ),
                'selector' => '{{WRAPPER}} .flashsale-slider-top a',
            ]
        );
        $this->add_responsive_control(
            'btn_radius',
            [
                'label' => esc_html__( 'Border Radius', 'restrofood' ),
                'type' => Controls_Manager::DIMENSIONS,
                'devices' => [ 'desktop', 'tablet', 'mobile' ],
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .flashsale-slider-top a' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
                ],
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'btn_box_shadow',
                'label' => esc_html__( 'Box Shadow', 'restrofood' ),
                'selector' => '{{WRAPPER}} .flashsale-slider-top a',
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Background::get_type(),
            [
                'name' => 'btn_bg_color',
                'label' => esc_html__( 'Button Background Color', 'restrofood' ),
                'types' => [ 'classic', 'gradient' ],
                'selector' => '{{WRAPPER}} .flashsale-slider-top a',
            ]
        );

        $this->end_controls_tab(); // End Controls tab

        //  Controls tab For Hover
        $this->start_controls_tab(
            'btn_hover_normal',
            [
                'label' => esc_html__( 'Hover', 'restrofood' ),
            ]
        );

        $this->add_control(
            'btn_hover_color',
            [
                'label' => esc_html__( 'Hover Text Color', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .flashsale-slider-top a:hover' => 'color: {{VALUE}}',
                ],
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'btn_hover_border',
                'label' => esc_html__( 'Hover Border', 'restrofood' ),
                'selector' => '{{WRAPPER}} .flashsale-slider-top a:hover',
            ]
        );
        $this->add_responsive_control(
            'btn_hover_radius',
            [
                'label' => esc_html__( 'Hover Border Radius', 'restrofood' ),
                'type' => Controls_Manager::DIMENSIONS,
                'devices' => [ 'desktop', 'tablet', 'mobile' ],
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .flashsale-slider-top a:hover' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
                ],
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'btn_hover_box_shadow',
                'label' => esc_html__( 'Hover Box Shadow', 'restrofood' ),
                'selector' => '{{WRAPPER}} .flashsale-slider-top a:hover',
            ]
        );
        $this->add_group_control(
            \Elementor\Group_Control_Background::get_type(),
            [
                'name' => 'btn_hover_bg_color',
                'label' => esc_html__( 'Hover Button Background Color', 'restrofood' ),
                'types' => [ 'classic', 'gradient' ],
                'selector' => '{{WRAPPER}} .flashsale-slider-top a:hover',
            ]
        );

        $this->end_controls_tab(); // End Controls tab
        $this->end_controls_tabs(); //  end controls tabs section
        $this->end_controls_section();

        

	}

	protected function render() {

        // get settings
        $settings = $this->get_settings_for_display();

        $limit          = !empty( $settings['limit'] ) ? $settings['limit'] : '';
        $itemsPerSlide  = !empty( $settings['items_per_slide'] ) ? $settings['items_per_slide'] : '';
        $title         = !empty( $settings['title'] ) ? $settings['title'] : '';
        $showVab         = !empty( $settings['show_vab'] ) ? $settings['show_vab'] : '';
        $btnLink         = !empty( $settings['btn_link']['url'] ) ? $settings['btn_link']['url'] : '';
        echo do_shortcode( '[restrofood_flash_products limit="'.esc_attr( $limit ).'" per_slide="'.esc_attr( $itemsPerSlide ).'"  title="'.esc_attr( $title ).'" show_btn="'.esc_attr( $showVab ).'" link="'.esc_attr( $btnLink ).'"]' );

    }
    


}
