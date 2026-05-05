<script type="text/html" id="tmpl-rb_loginreg">
  <div class="rb_steps_content step-loginreg">

    <div class="rb_card">
      <div class="rb_multiform">
        <!-- Form Selector Group -->
        <ul class="rb_list_unstyled rb_form_selector_list">
          <li class="rb_single_form_selector">
            <span class="rb_custom_checkbox">
              <label>
                <input
                  type="radio"
                  value="product_category"
                  name="rb_product_category"
                  data-form="rb_login_form"
                  checked
                />
                <span class="rb_label_title"><?php esc_html_e( 'Sign-In', 'restrofood' ); ?></span>
                <span class="rb_custom_checkmark"></span>
              </label>
            </span>
          </li>
          <li class="rb_single_form_selector">
            <span class="rb_custom_checkbox">
              <label>
                <input
                  type="radio"
                  value="product_category"
                  name="rb_product_category"
                  data-form="rb_signup_form"
                />
                <span class="rb_label_title"><?php esc_html_e( 'Sign-Up', 'restrofood' ); ?></span>
                <span class="rb_custom_checkmark"></span>
              </label>
            </span>
          </li>
        </ul>
        <!-- End Form Selector Group -->

        <!-- Single Form -->
        <div class="rb_single_form rb_login_form show">
          <form action="#" method="post" id="rb_form_log_in" class="form_log_in">
            <div class="rb_row">
              <div class="rb_col_md_6">
                <div class="rb_input_group">
                  <input
                    type="text"
                    id="rb_user_email"
                    class="rb_input_style"
                    name="uname"
                    required
                  />
                  <label
                    for="rb_user_email"
                    class="rb_input_label"
                    ><?php esc_html_e( 'username/email', 'restrofood' ); ?> <span>*</span></label
                  >
                </div>
              </div>
              <div class="rb_col_md_6">
                <div class="rb_input_group">
                  <input
                    type="password"
                    id="rb_user_password"
                    name="paw"
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
                <input type="submit" class="rb_btn_fill" value="Login" />
                
              </div>
            </div>
            <?php wp_nonce_field( 'restrofood-login-nonce', 'security' ); ?>
          </form>
        </div>
        <!-- End Single Form -->

        <!-- Single Form -->
        <div class="rb_single_form rb_signup_form">
          <form action="#" method="post" id="rb_form_signup" class="form_log_in">
            <div class="rb_row">
              <div class="rb_col_md_4">
                <div class="rb_input_group">
                  <input
                    type="text"
                    id="rb_new_user_name"
                    class="rb_input_style"
                    name="username"
                    required
                  />
                  <label
                    for="rb_new_user_email"
                    class="rb_input_label"
                    ><?php esc_html_e( 'username', 'restrofood' ); ?><span>*</span></label
                  >
                </div>
              </div>
              <div class="rb_col_md_4">
                <div class="rb_input_group">
                  <input
                    type="text"
                    id="rb_new_user_email"
                    class="rb_input_style"
                    name="useremail"
                    required
                  />
                  <label
                    for="rb_new_user_email"
                    class="rb_input_label"
                    ><?php esc_html_e( 'email', 'restrofood' ); ?> <span>*</span></label
                  >
                </div>
              </div>
              <div class="rb_col_md_4">
                <div class="rb_input_group">
                  <input
                    type="password"
                    id="rb_new_user_password"
                    class="rb_input_style"
                    name="password"
                    required
                  />
                  <label
                    class="rb_input_label"
                    for="rb_new_user_password"
                    ><?php esc_html_e( 'Choose your Password', 'restrofood' ); ?> <span>*</span></label
                  >
                </div>
              </div>
              <?php wp_nonce_field( 'restrofood-signup-nonce', 'security' ); ?>
              <div class="rb_col_12">
                <button type="submit" class="rb_btn_fill"><?php esc_html_e( 'SignUp', 'restrofood' ); ?></button>
              </div>
            </div>
          </form>
        </div>
        <!-- End Single Form -->
      </div>
    </div>
  </div>
</script>