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
 * Elementor Products_Card widget.
 *
 * @since 1.0
 */

class Products_Card extends Widget_Base {
    
	public function get_name() {
		return 'restrofood-products-card';
	}

	public function get_title() {
		return esc_html__( 'Products Card', 'restrofood' );
	}

	public function get_icon() {
		return 'eicon-text';
	}

	public function get_categories() {
		return ['restrofood-elements-category'];
	}

	protected function register_controls() {

		$repeater = new \Elementor\Repeater();

        // ---------------------------------------- content ------------------------------
        $this->start_controls_section(
            'restrofood_products_card_content_settings',
            [
                'label' => esc_html__( 'Products Card Content', 'restrofood' ),
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
            'layout',
            [
                'label' => esc_html__( 'Layout', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'grid',
                'options' => [
                    'grid'  => esc_html__( 'Grid', 'restrofood' ),
                    'list' => esc_html__( 'List', 'restrofood' ),
                ],
            ]
        );
        $this->add_control(
            'style',
            [
                'label' => esc_html__( 'Layout Style', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => '1',
                'options' => [
                    '1'  => esc_html__( 'Style 1', 'restrofood' ),
                    '2' => esc_html__( 'Style 2', 'restrofood' ),
                    '3' => esc_html__( 'Style 3', 'restrofood' )
                ],
            ]
        );
        $this->add_control(
            'column',
            [
                'label' => esc_html__( 'Column', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::SELECT,
                'condition' => [ 'layout' => 'grid' ],
                'default' => '4',
                'options' => [
                    '2'  => esc_html__( '2 Column', 'restrofood' ),
                    '3' => esc_html__( '3 Column', 'restrofood' ),
                    '4' => esc_html__( '4 Column', 'restrofood' )
                ],
            ]
        );
        $this->add_control(
            'mini_cart_type',
            [
                'label' => esc_html__( 'Mini Cart Type', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'canvas',
                'options' => [
                    'canvas'  => esc_html__( 'Canvas', 'restrofood' ),
                    'footer-fixed' => esc_html__( 'Footer Fixed', 'restrofood' ),
                    'beside-products' => esc_html__( 'Beside Products', 'restrofood' )
                ],
            ]
        );
        $this->add_control(
            'cat',
            [
                'label' => esc_html__( 'Category', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => restrofood_get_categories(),
            ]
        );
        $this->add_control(
            'show_search',
            [
                'label' => esc_html__( 'Show Search', 'restrofood' ),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__( 'Show', 'restrofood' ),
                'label_off' => esc_html__( 'Hide', 'restrofood' ),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );
        
        $this->end_controls_section(); // End  content

        //------------------------------ Style ------------------------------
        $this->start_controls_section(
            'restrofood_products_card_style', [
                'label' => esc_html__( 'Products Card Style', 'restrofood' ),
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

        

	}

	protected function render() {

        // get settings
        $settings = $this->get_settings_for_display();

        $limit          = !empty( $settings['limit'] ) ? $settings['limit'] : '';
        $col            = !empty( $settings['column'] ) ? $settings['column'] : '';
        $layout         = !empty( $settings['layout'] ) ? $settings['layout'] : '';
        $style          = !empty( $settings['style'] ) ? $settings['style'] : '';
        $miniCartType   = !empty( $settings['mini_cart_type'] ) ? $settings['mini_cart_type'] : '';
        $search         = !empty( $settings['show_search'] ) ? $settings['show_search'] : '';
        $cat            = !empty( $settings['cat'] ) ? $settings['cat'] : '';

        echo do_shortcode( '[restrofood_products limit="'.esc_attr( $limit ).'" style="'.esc_attr($style).'"  col="'.esc_attr( $col ).'" layout="'.esc_attr( $layout ).'" mini_cart_type="'.esc_attr( $miniCartType ).'" search="'.esc_attr( $search ).'" cat="'.esc_attr( $cat ).'"]' );

    }
    
}
