<?php
/**
 *
 * @package     RestroFood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 */

get_header();

?>

<div class="rb__wrapper">
	<div class="rb_container">
        <div class="rb_row">
            <div class="rb_col_12">
				<div class="rb_card">
			      <div class="rb_multiform">
			        <h2> <?php esc_html_e( 'Sign In', 'restrofood' ); ?> </h2>
			        <!-- Single Form -->
			        <div class="rb_single_form rb_login_form show">
			         	<form action="<?php echo site_url( '/wp-login.php' ); ?>" method="post" class="form_log_in">
			            <div class="rb_row">
			              <div class="rb_col_md_6">
			                <div class="rb_input_group">
			                  <input
			                    type="text"
			                    id="rb_user_email"
			                    class="rb_input_style"
			                    name="log"
			                    required
			                  />
			                  <label
			                    for="rb_user_email"
			                    class="rb_input_label"
			                    ><?php esc_html_e( 'username/email', 'restrofood' ); ?><span>*</span></label
			                  >
			                </div>
			              </div>
			              <div class="rb_col_md_6">
			                <div class="rb_input_group">
			                  <input
			                    type="password"
			                    id="rb_user_password"
			                    name="pwd"
			                    class="rb_input_style"
			                    required
			                  />
			                  <label
			                    class="rb_input_label"
			                    for="rb_user_password"
			                    ><?php esc_html_e( 'Password', 'restrofood' ); ?> <span>*</span></label
			                  >
			                </div>
			              </div>
			              <div class="rb_col_12">
			              	<?php wp_nonce_field( 'restrofood-login-nonce', 'security' ); ?>
			                <input type="submit" class="rb_btn_fill" value="<?php esc_html_e( 'Login', 'restrofood' ); ?>" />
			              </div>
			            </div>
			        	</form>
			        </div>
			        <!-- End Single Form -->
			      </div>
			    </div>

            </div>
        </div>
	</div>
</div>
<?php


get_footer();