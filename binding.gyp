{
    'targets': [
        {
            'target_name': 'vad',
            'product_extension': 'node',
            'type': 'loadable_module',
            'defines': [],
            'include_dirs': ["<!(node -e \"require('nan')\")", "./src"],
            'sources': [
                'src/simplevad.c',
                'src/vad_bindings.cc'
            ],
            'dependencies': [
                './vendor/webrtc_vad/webrtc_vad.gyp:webrtc_vad'
            ],
            'conditions': [
                ['OS=="mac"', {
                    "xcode_settings": {
                        "MACOSX_DEPLOYMENT_TARGET": "10.9",
                        "CLANG_CXX_LIBRARY": "libc++"
                    }
                }]
            ]
        }
    ]
}
